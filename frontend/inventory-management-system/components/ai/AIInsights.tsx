
import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, ChatMessage } from '../../types';
import { generateInventoryInsights } from '../../services/geminiService';
import { SendIcon, SparklesIcon } from '../Icons';

interface AIInsightsProps {
    items: InventoryItem[];
}

const examplePrompts = [
    "Which items are low on stock?",
    "What is the total value of my inventory?",
    "Summarize my electronics category.",
    "Suggest a new product I could stock.",
];

export const AIInsights: React.FC<AIInsightsProps> = ({ items }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (promptText: string) => {
        if (!promptText.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { sender: 'user', text: promptText };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const aiResponse = await generateInventoryInsights(items, promptText);
            const newAiMessage: ChatMessage = { sender: 'ai', text: aiResponse };
            setMessages(prev => [...prev, newAiMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { sender: 'ai', text: "Sorry, something went wrong." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage(userInput);
    };

    return (
        <div className="bg-white shadow-lg rounded-lg w-full">
            <div className="p-4 border-b border-gray-200 flex items-center">
                <SparklesIcon className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold text-secondary ml-2">AI-Powered Insights</h2>
            </div>
            <div className="p-4 h-96 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
                {messages.length === 0 && !isLoading && (
                    <div className="text-center m-auto text-gray-500">
                        <p className="mb-4">Ask me anything about your inventory!</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {examplePrompts.map(prompt => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSendMessage(prompt)}
                                    className="p-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-100 hover:border-primary transition"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white"><SparklesIcon className="h-5 w-5"/></div>}
                        <div className={`max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-white border'}`}>
                           <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white"><SparklesIcon className="h-5 w-5"/></div>
                        <div className="max-w-lg p-3 rounded-lg bg-white border">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        placeholder="Ask about your inventory..."
                        className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !userInput.trim()}
                        className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-hover disabled:bg-gray-300 transition"
                    >
                        <SendIcon className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};
