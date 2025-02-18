import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GeminiProjectAI = () => {
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [finalResponse, setFinalResponse] = useState(null);

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

  const API_KEY = "AIzaSyDMP3X-7sPJHCtgr1Kz26fItvmibga8Wmw";
  console.log('API Key:', API_KEY); // Debug log
  console.log('All env vars:', process.env);
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

  useEffect(() => {
    initializeConversation();
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

      const response = await axios.post(GEMINI_API_URL, requestBody, {
        headers: { 'Content-Type': 'application/json' }
      });

      const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Hello! I\'m here to help you define your project. What\'s your project idea?';
      
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
          default:
            errorMessage = 'An error occurred. Please try again.';
        }
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

      const response = await axios.post(GEMINI_API_URL, requestBody, {
        headers: { 'Content-Type': 'application/json' }
      });

      const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Could you please clarify that?';
      
      setConversation(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
      console.error('Message error:', error);
      let errorMessage = 'Failed to get response. Please try again.';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = 'Invalid request. Please try rephrasing your message.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          default:
            errorMessage = 'An error occurred. Please try again.';
        }
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

      const response = await axios.post(GEMINI_API_URL, requestBody, {
        headers: { 'Content-Type': 'application/json' }
      });

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
      console.log('Data being sent to UploadProject:', finalResponse); // Debug log
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
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserMessage();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-center text-gray-800">AI Project Assistant</h1>
          <p className="text-center text-gray-600 mt-2">
            Let's define your project requirements together
          </p>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="p-6">
          <div className="h-96 overflow-y-auto space-y-4 mb-4" id="conversation">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-100 ml-8 text-blue-900'
                    : 'bg-gray-100 mr-8 text-gray-900'
                }`}
              >
                <p className="text-sm font-medium mb-1">
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </p>
                <p className="text-gray-700 break-words whitespace-pre-wrap">
                  {msg.text}
                </p>
              </div>
            ))}
          </div>

          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me about your project idea..."
            className="w-full min-h-[100px] p-4 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={loading}
          />

          <div className="flex gap-4">
            <button 
              onClick={handleUserMessage}
              disabled={loading || !userInput.trim()}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-medium
                ${loading || !userInput.trim()
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              className={`flex-1 px-4 py-2 rounded-lg font-medium
                ${loading || conversation.length < 3
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400'
                }`}
            >
              Finalize Project
            </button>
          </div>
        </div>
      </div>

      {finalResponse && (
        <div className="w-full max-w-3xl mt-4 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Project Summary</h2>
          </div>
          <div className="p-6">
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(finalResponse, null, 2)}
            </pre>
            <button
              onClick={handleCreateProject}
              className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 active:bg-green-800"
            >
              Create Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiProjectAI;