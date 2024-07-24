import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('json', json);

const App = () => {
    const [recording, setRecording] = useState(null);
    const [mappings, setMappings] = useState({
        usernameMappings: [],
        passwordMappings: [],
        newPasswordMappings: []
    });
    const [unmappedFields, setUnmappedFields] = useState([]);
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
    const [generatedPayload, setGeneratedPayload] = useState('{}');
    const textAreaRef = useRef(null);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                setRecording(json);

                // Extract all 'change' type steps
                const changeSteps = json.steps.filter(step => step.type === 'change');
                setUnmappedFields(changeSteps.map(step => JSON.stringify(step.selectors)));
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

        if (source.droppableId === 'unmappedFields') {
            // Moving from unmapped to a mapping
            const newUnmappedFields = Array.from(unmappedFields);
            const [removed] = newUnmappedFields.splice(source.index, 1);
            setUnmappedFields(newUnmappedFields);

            const newMappings = { ...mappings };
            newMappings[destination.droppableId].splice(destination.index, 0, removed);
            setMappings(newMappings);
        } else if (destination.droppableId === 'unmappedFields') {
            // Moving from a mapping back to unmapped
            const newMappings = { ...mappings };
            const [removed] = newMappings[source.droppableId].splice(source.index, 1);
            setMappings(newMappings);

            const newUnmappedFields = Array.from(unmappedFields);
            newUnmappedFields.splice(destination.index, 0, removed);
            setUnmappedFields(newUnmappedFields);
        } else {
            // Moving between mappings
            const newMappings = { ...mappings };
            const [removed] = newMappings[source.droppableId].splice(source.index, 1);
            newMappings[destination.droppableId].splice(destination.index, 0, removed);
            setMappings(newMappings);
        }
    };

    const generatePayload = () => {
        if (!recording || Object.values(mappings).some(m => m.length === 0)) {
            alert('Please map all fields before generating the payload.');
            return;
        }

        const usernameStep = recording.steps.find(step =>
            step.type === "change" && JSON.stringify(step.selectors) === mappings.usernameMappings[0]);
        const newPasswordStep = recording.steps.find(step =>
            step.type === "change" && JSON.stringify(step.selectors) === mappings.newPasswordMappings[0]);

        const payload = {
            username: usernameStep ? usernameStep.value : '',
            password: newPasswordStep ? newPasswordStep.value : '',
            recording: recording,
            usernameMappings: mappings.usernameMappings.map(JSON.parse),
            passwordMappings: mappings.passwordMappings.map(JSON.parse),
            newPasswordMappings: mappings.newPasswordMappings.map(JSON.parse),
            passwordOptions: passwordOptions
        };

        setGeneratedPayload(JSON.stringify(payload, null, 2));
    };

    const isGenerateButtonEnabled = unmappedFields.length === 0 && recording !== null;

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
                    <div className="grid grid-cols-4 gap-4 mb-4">
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
                                            <Draggable key={item} draggableId={item} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="bg-white p-2 mb-2 rounded"
                                                    >
                                                        {item}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        ))}
                        <Droppable droppableId="unmappedFields">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="bg-gray-100 p-4 rounded-lg"
                                >
                                    <h2 className="text-xl font-semibold mb-2">Unmapped Fields</h2>
                                    {unmappedFields.map((item, index) => (
                                        <Draggable key={item} draggableId={item} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="bg-white p-2 mb-2 rounded"
                                                >
                                                    {item}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                </DragDropContext>
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
                                    onChange={(e) => setPasswordOptions({ ...passwordOptions, [key]: e.target.checked })}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => setPasswordOptions({ ...passwordOptions, [key]: e.target.value })}
                                    className="border rounded px-2 py-1"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={generatePayload}
                disabled={!isGenerateButtonEnabled}
                className={`mt-4 px-4 py-2 rounded ${isGenerateButtonEnabled
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
            >
                Generate Payload
            </button>

            {generatedPayload !== '{}' && (
                <div className="mt-4">
                    <h2 className="text-2xl font-semibold mb-2">Generated Payload</h2>
                    <div className="relative">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(generatedPayload);
                                alert('Payload copied to clipboard!');
                            }}
                            className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                            Copy
                        </button>

                        <textarea
                            ref={textAreaRef}
                            value={generatedPayload}
                            readOnly
                            className="absolute top-0 left-0 opacity-0 z--1"
                        />
                        <SyntaxHighlighter language="json" style={docco}>
                            {generatedPayload}
                        </SyntaxHighlighter>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
