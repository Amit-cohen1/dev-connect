import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProjectMascot from '../components/ProjectMascot';

// Create a dedicated axios instance for Gemini API
const geminiApi = axios.create({
  timeout: 10000,  // 10 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor to handle errors consistently
geminiApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.error('API Key validation failed:', error.response);
    }
    return Promise.reject(error);
  }
);

const GeminiProjectAI = () => {
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [finalResponse, setFinalResponse] = useState(null);
  const [mascotState, setMascotState] = useState({
    message: '',
    isVisible: false,
    position: 'left'
  });

  const messagesEndRef = useRef(null);
  const [animateInput, setAnimateInput] = useState(false);

  const scrollToBottom = () => {
    // Only scroll if user is already near the bottom
    const scrollEl = messagesEndRef.current?.parentElement;
    if (scrollEl) {
      const { scrollHeight, scrollTop, clientHeight } = scrollEl;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      if (isNearBottom) {
        scrollEl.scrollTo({
          top: scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Available technologies list (matching UploadProject.js)
  const technologies = [
    // Frontend Frameworks & Libraries
    'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby',
    'React Native', 'Flutter', 'Ionic', 'Electron',
    
    // Backend Technologies
    'Node.js', 'Python', 'Java', 'C#', '.NET', 'PHP', 'Ruby', 'Go', 'Rust',
    'Spring Boot', 'Django', 'Flask', 'Laravel', 'Express.js', 'NestJS',
    
    // Cloud & Infrastructure
    'AWS', 'Azure', 'Firebase', 'Google Cloud', 'Heroku', 'DigitalOcean',
    'Docker', 'Kubernetes', 'Terraform', 'Jenkins',
    
    // Databases
    'MongoDB', 'PostgreSQL', 'MySQL', 'SQL Server', 'Redis', 'Cassandra',
    'GraphQL', 'DynamoDB', 'SQLite',
    
    // Mobile Development
    'iOS', 'Android', 'Kotlin', 'Swift', 'Xamarin',
    
    // Frontend Technologies
    'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Sass', 'Tailwind CSS',
    'Bootstrap', 'Material UI', 'Redux', 'WebPack',
    
    // Testing & Quality
    'Jest', 'Cypress', 'Selenium', 'JUnit', 'PyTest',
    
    // AI & ML
    'Machine Learning', 'AI', 'TensorFlow', 'PyTorch', 'OpenAI',
    
    // Version Control & DevOps
    'Git', 'GitHub Actions', 'GitLab CI', 'Jira', 'Agile'
  ];

  const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
  if (!API_KEY) {
    console.error('Missing API key:', {
      environmentVars: Object.keys(process.env).filter(key => key.includes('GEMINI')),
      hasReactAppPrefix: !!process.env.REACT_APP_GEMINI_API_KEY
    });
  }
  console.log('Environment Variables:', {
    hasGeminiKey: !!process.env.REACT_APP_GEMINI_API_KEY,
    envVars: process.env
  });
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

  const showMascot = (message, position = 'left') => {
    setMascotState({
      message,
      isVisible: true,
      position
    });
    // Hide mascot after 8 seconds
    setTimeout(() => {
      setMascotState(prev => ({...prev, isVisible: false}));
    }, 8000);
  };

  useEffect(() => {
    if (!API_KEY) {
      setError('Gemini API key is not configured. Please add REACT_APP_GEMINI_API_KEY to your environment variables.');
      console.log('Available env vars:', process.env); // Debug line
      return;
    }
    
    // Set API key for all requests
    geminiApi.defaults.params = { key: API_KEY };
    
    // Clear any existing cache
    if (window.performance && window.performance.navigation.type === 2) {
      window.location.reload();
    }
    
    initializeConversation();
    
    // Show welcome message
    showMascot("👋 Hi! I'm DevBot, your project planning assistant. Tell me about your project idea!", 'right');
    
    // Cleanup on unmount
    return () => {
      setConversation([]);
      setFinalResponse(null);
    };
  }, []);

  const initializeConversation = async () => {
    setLoading(true);
    try {
      const requestBody = {
        contents: [{
          parts: [{
            text: `You are a project planning assistant. Guide users in defining their project by asking about:
                   1. Project title and brief description
                   2. Technical requirements and implementation details
                   3. Required technologies (from this list only: ${technologies.join(', ')})
                   4. Project difficulty (beginner, intermediate, or advanced)
                   5. Estimated time to complete
                   6. Number of developers needed
                   7. Whether GitHub knowledge is required
                   8. Enrollment type (direct, application, or hybrid)
                   
                   Start by asking about their project idea.`
          }]
        }]
      };

      const response = await geminiApi.post(GEMINI_API_URL, requestBody);

      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid API response format');
      }

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      setConversation([{ role: 'ai', text: aiResponse }]);
    } catch (error) {
      console.error('Initialization error:', error);
      
      let errorMessage = 'Failed to start. Please check your connection and try again.';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = 'Invalid API request. Please check the API configuration.';
            break;
          case 401:
            errorMessage = 'Invalid API key. Please check your API key configuration.';
            break;
          case 403:
            errorMessage = 'Access forbidden. Please verify your API permissions.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 503:
            errorMessage = 'Gemini API service is temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = `An error occurred (${error.response.status}). Please try again.`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUserMessage = async () => {
    if (!userInput.trim() || loading) return;

    try {
      setLoading(true);
      setError('');
      
      // Show thinking message
      showMascot("I'm thinking about how to help with your project...", 'left');
      
      const updatedConversation = [...conversation, { role: 'user', text: userInput }];
      setConversation(updatedConversation);
      setUserInput('');

      const requestBody = {
        contents: [{
          parts: [{ 
            text: `Previous conversation: ${updatedConversation.map(msg => `${msg.role}: ${msg.text}`).join('\n')}
                  Based on this context, provide a helpful response to guide the project definition. Remember to only suggest technologies from the provided list.`
          }]
        }]
      };

      const response = await geminiApi.post(GEMINI_API_URL, requestBody);

      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid API response format');
      }

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      setConversation(prev => [...prev, { role: 'ai', text: aiResponse }]);

      // Show encouragement after response
      if (updatedConversation.length <= 4) {
        showMascot("That's great! Keep going - we're making good progress!", 'right');
      }
    } catch (error) {
      console.error('Message error:', error);
      
      let errorMessage = 'Failed to get response. Please try again.';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = 'Invalid request. Please try rephrasing your message.';
            break;
          case 401:
            errorMessage = 'Authentication failed. Please refresh the page and try again.';
            break;
          case 403:
            errorMessage = 'Access forbidden. Please verify API permissions.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = `An error occurred (${error.response.status}). Please try again.`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeProject = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError('');
      
      showMascot("I'll help you create a summary of your project...", 'left');

      const requestBody = {
        contents: [{
          parts: [{
            text: `Based on this conversation, generate a valid JSON object with these exact fields. 
                   Do not include any markdown syntax, code blocks, or additional text.
                   Only return a raw JSON object like this:
                   {
                     "title": "Project title",
                     "description": "Detailed project description",
                     "requirements": "Specific requirements and prerequisites",
                     "technologies": ["Array of required technologies from: ${technologies.join(', ')}"],
                     "difficulty": "beginner/intermediate/advanced",
                     "timeEstimate": "Estimated completion time",
                     "maxDevelopers": "Number",
                     "githubRequired": boolean,
                     "enrollmentType": "direct/application/hybrid"
                   }

                   Conversation context:
                   ${conversation.map(msg => `${msg.role}: ${msg.text}`).join('\n')}
                   
                   Remember to return ONLY the JSON with no markdown or extra text.`
          }]
        }]
      };

      const response = await geminiApi.post(GEMINI_API_URL, requestBody);

      const projectText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      // Clean the response text to extract just the JSON
      const cleanJsonText = projectText
        .replace(/```json/g, '') // Remove ```json
        .replace(/```/g, '')     // Remove remaining ```
        .trim();                 // Remove extra whitespace

      try {
        const jsonResponse = JSON.parse(cleanJsonText);
        
        // Format the response to match UploadProject form structure
        const validatedResponse = {
          title: jsonResponse.title || '',
          description: jsonResponse.description || '',
          requirements: jsonResponse.requirements || '',
          technologies: Array.isArray(jsonResponse.technologies) ? 
            jsonResponse.technologies.filter(tech => technologies.includes(tech)) : [],
          difficulty: ['beginner', 'intermediate', 'advanced'].includes(jsonResponse.difficulty) ? 
            jsonResponse.difficulty : 'beginner',
          timeEstimate: jsonResponse.timeEstimate || '',
          maxDevelopers: parseInt(jsonResponse.maxDevelopers) || 1,
          githubRequired: Boolean(jsonResponse.githubRequired),
          enrollmentType: ['direct', 'application', 'hybrid'].includes(jsonResponse.enrollmentType) ? 
            jsonResponse.enrollmentType : 'direct',
          // Additional fields needed by UploadProject
          status: 'open',
          applicants: [],
          assignedDevelopers: [],
          // Let Firebase handle timestamps
          dateCreated: null,  // Will be set by serverTimestamp()
          dateUpdated: null   // Will be set by serverTimestamp()
        };
        
        setFinalResponse(validatedResponse);
        showMascot("Great! I've created a summary of your project. Review it and click 'Create Project' when you're ready!", 'right');
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        console.log('Failed to parse text:', cleanJsonText);
        setError('Failed to generate valid project summary. Please try again.');
      }
    } catch (error) {
      console.error('Finalization error:', error);
      setError('Failed to generate project summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    if (finalResponse) {
      showMascot("Perfect! Let's create your project now!", 'right');
      setTimeout(() => {
        navigate('/upload-project', { 
          state: { 
            formData: {
              title: finalResponse.title,
              description: finalResponse.description,
              requirements: finalResponse.requirements,
              technologies: finalResponse.technologies,
              difficulty: finalResponse.difficulty,
              timeEstimate: finalResponse.timeEstimate,
              maxDevelopers: finalResponse.maxDevelopers,
              githubRequired: finalResponse.githubRequired,
              enrollmentType: finalResponse.enrollmentType
            },
            autoSubmit: true
          },
          replace: true
        });
      }, 1500);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserMessage();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center">
          <div className="flex items-center gap-4">
          </div>
          <p className="text-center text-gray-600 mt-2">
            Let's bring your project idea to life together
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-fade-in">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Chat Container */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Messages Area */}
            <div 
              className="h-[500px] overflow-y-auto p-6 space-y-4 scroll-smooth"
              style={{ scrollBehavior: 'smooth' }}
            >
              {conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white ml-8'
                        : 'bg-gray-100 text-gray-800 mr-8'
                    } shadow-md transform transition-all duration-200 hover:scale-[1.02]`}
                  >
                    <p className="text-sm font-medium mb-1 opacity-75">
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </p>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className={`transform transition-all duration-200 ${animateInput ? 'scale-[1.02]' : ''}`}>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setAnimateInput(true)}
                  onBlur={() => setAnimateInput(false)}
                  placeholder="Share your project idea..."
                  className="w-full min-h-[100px] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white shadow-inner transition-shadow duration-200"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-4 mt-4">
                <button 
                  onClick={handleUserMessage}
                  disabled={loading || !userInput.trim()}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform
                    ${loading || !userInput.trim()
                      ? 'bg-blue-300 cursor-not-allowed opacity-75'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:scale-[1.02] active:scale-[0.98]'
                    } text-white shadow-md hover:shadow-lg`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : 'Send Message'}
                </button>
                <button 
                  onClick={handleFinalizeProject}
                  disabled={loading || conversation.length < 3}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform
                    ${loading || conversation.length < 3
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 active:bg-indigo-300 hover:scale-[1.02] active:scale-[0.98]'
                    } shadow-md hover:shadow-lg`}
                >
                  Finalize Project
                </button>
              </div>
            </div>
          </div>

          {/* Project Summary */}
          {finalResponse && (
            <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-2xl font-bold text-gray-800">Project Summary</h2>
                <p className="text-gray-600 mt-1">Review your project details before creation</p>
              </div>
              <div className="p-6">
                <div className="bg-gray-50 p-6 rounded-xl overflow-x-auto">
                  <pre className="text-sm text-gray-800">
                    {JSON.stringify(finalResponse, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={handleCreateProject}
                  className="w-full mt-6 px-6 py-3 bg-green-600 text-white rounded-xl font-medium
                    transition-all duration-200 transform hover:bg-green-700 active:bg-green-800
                    hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
                >
                  Create Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mascot Component */}
      <ProjectMascot 
        message={mascotState.message}
        isVisible={mascotState.isVisible}
        position={mascotState.position}
      />
    </div>
  );
};

export default GeminiProjectAI;