import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';


const App = () => {
    const [recording, setRecording] = useState(null);
    const [mappings, setMappings] = useState({
        usernameMappings: [],
        passwordMappings: [],
        newPasswordMappings: []
    });
    const [passwordOptions, setPasswordOptions] = useState({
        length: 16,
        lowercase: true,
        uppercase: true,
        numbers: true,
        symbols: true,
        excludeSimilarCharacters: true,
        exclude: "Il1O0",
        strict: true,
        symbolsToUse: "!@#$%^&*-_+=:"
    });
    const [generatedPayload, setGeneratedPayload] = useState(null);
    const payloadRef = useRef(null);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                setRecording(json);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                alert('Error parsing JSON file. Please ensure it\'s a valid JSON.');
            }
        };
        reader.readAsText(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const { source, destination } = result;
        const newMappings = { ...mappings };
        const [removed] = newMappings[source.droppableId].splice(source.index, 1);
        newMappings[destination.droppableId].splice(destination.index, 0, removed);
        setMappings(newMappings);
    };

    const generatePayload = () => {
        if (!recording || Object.values(mappings).some(m => m.length === 0)) {
            alert('Please map all fields before generating the payload.');
            return;
        }

        const payload = {
            username: recording.steps.find(step => 
                JSON.stringify(step.selectors) === JSON.stringify(mappings.usernameMappings[0]))?.value || '',
            password: recording.steps.find(step => 
                JSON.stringify(step.selectors) === JSON.stringify(mappings.passwordMappings[0]))?.value || '',
            recording: recording,
            usernameMappings: mappings.usernameMappings,
            passwordMappings: mappings.passwordMappings,
            newPasswordMappings: mappings.newPasswordMappings,
            passwordOptions: passwordOptions
        };

        setGeneratedPayload(JSON.stringify(payload, null, 2));
    };

    const copyToClipboard = () => {
        if (payloadRef.current) {
            navigator.clipboard.writeText(payloadRef.current.textContent).then(() => {
                alert('Payload copied to clipboard!');
            }, (err) => {
                console.error('Could not copy text: ', err);
            });
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">Custom UI Credential Rotator</h1>
            
            <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                <input {...getInputProps()} />
                {isDragActive ? (
                    <p>Drop the file here ...</p>
                ) : (
                    <p>Drag 'n' drop your recording JSON file here, or click to select files</p>
                )}
            </div>

            {recording && (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-3 gap-4">
                        {Object.entries(mappings).map(([key, value]) => (
                            <Droppable key={key} droppableId={key}>
                                {(provided) => (
                                    <div 
                                        ref={provided.innerRef} 
                                        {...provided.droppableProps}
                                        className="bg-gray-100 p-4 rounded-lg"
                                    >
                                        <h2 className="text-xl font-semibold mb-2">{key}</h2>
                                        {value.map((item, index) => (
                                            <Draggable key={JSON.stringify(item)} draggableId={JSON.stringify(item)} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="bg-white p-2 mb-2 rounded"
                                                    >
                                                        {JSON.stringify(item)}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </DragDropContext>
            )}

            {recording && (
                <div className="mt-4">
                    <h2 className="text-2xl font-semibold mb-2">Unmapped Fields</h2>
                    <div className="bg-gray-100 p-4 rounded-lg">
                        {recording.steps
                            .filter(step => step.type === 'change')
                            .filter(step => !Object.values(mappings).some(m => 
                                m.some(item => JSON.stringify(item) === JSON.stringify(step.selectors))
                            ))
                            .map((step, index) => (
                                <div key={index} className="bg-white p-2 mb-2 rounded">
                                    {JSON.stringify(step.selectors)}
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            <div className="mt-4">
                <h2 className="text-2xl font-semibold mb-2">Password Options</h2>
                <div className="grid grid-cols-2 gap-4">
                    {Object.entries(passwordOptions).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                            <label className="mr-2">{key}:</label>
                            {typeof value === 'boolean' ? (
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) => setPasswordOptions({...passwordOptions, [key]: e.target.checked})}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => setPasswordOptions({...passwordOptions, [key]: e.target.value})}
                                    className="border rounded px-2 py-1"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <button 
                onClick={generatePayload}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Generate Payload
            </button>

            {generatedPayload && (
                <div className="mt-4">
                    <h2 className="text-2xl font-semibold mb-2">Generated Payload</h2>
                    <div className="relative">
                        <button 
                            onClick={copyToClipboard}
                            className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                            Copy
                        </button>
                        <SyntaxHighlighter language="json" style={SyntaxHighlighter.styles.prism}>
                            {generatedPayload}
                        </SyntaxHighlighter>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
