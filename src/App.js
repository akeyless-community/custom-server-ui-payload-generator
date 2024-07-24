import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('json', json);

const Toast = ({ message, isVisible, onHide }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onHide();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onHide]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-akeyless-blue text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300">
            {message}
        </div>
    );
};

const App = () => {
    const [showToast, setShowToast] = useState(false);
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

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedPayload);
        setShowToast(true);
    };

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
        <div className="bg-akeyless-bg min-h-screen">
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-4 text-akeyless-text">Akeyless Custom UI Rotation Payload Generator</h1>

                <div {...getRootProps()} className="border-2 border-dashed border-akeyless-border rounded-lg p-4 mb-4 bg-white">
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
                                            className="bg-white p-4 rounded-lg shadow border border-akeyless-border min-h-[100px]"
                                        >
                                            <h2 className="text-xl font-semibold mb-2 text-akeyless-text">{key}</h2>
                                            {value.map((item, index) => (
                                                <Draggable key={item} draggableId={item} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="bg-akeyless-bg p-2 mb-2 rounded border border-akeyless-border"
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
                                        className="bg-white p-4 rounded-lg shadow border border-akeyless-border min-h-[100px]"
                                    >
                                        <h2 className="text-xl font-semibold mb-2 text-akeyless-text">Unmapped Fields</h2>
                                        {unmappedFields.map((item, index) => (
                                            <Draggable key={item} draggableId={item} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="bg-akeyless-bg p-2 mb-2 rounded border border-akeyless-border"
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
                    <h2 className="text-2xl font-semibold mb-2 text-akeyless-text">Password Options</h2>
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
                        ? 'bg-akeyless-blue text-white hover:bg-opacity-90'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    Generate Payload
                </button>

                {generatedPayload !== '{}' && (
                    <div className="mt-4">
                        <h2 className="text-2xl font-semibold mb-2 text-akeyless-text">Generated Payload</h2>
                        <div className="relative">
                            <button
                                onClick={copyToClipboard}
                                className="absolute top-2 right-2 bg-akeyless-blue text-white px-2 py-1 rounded hover:bg-opacity-90"
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
                <Toast
                    message="Payload copied to clipboard!"
                    isVisible={showToast}
                    onHide={() => setShowToast(false)}
                />
            </div>
        </div>
    );
};

export default App;
