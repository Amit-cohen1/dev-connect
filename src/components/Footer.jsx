import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faFacebook, faLinkedin } from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        {/* Top Section */}
        <div className="flex flex-wrap justify-between items-start">
          {/* Quick Links */}
          <div className="mb-8 w-full md:w-1/3">
            <h3 className="text-lg font-bold mb-2">Quick Links</h3>
            <ul>
              <li className="mb-2">
                <a href="/projects" className="hover:underline">
                  Projects
                </a>
              </li>
              <li>
                <a href="/about" className="hover:underline">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* About Us Section */}
          <div className="mb-8 w-full md:w-1/3">
            <h3 className="text-lg font-bold mb-2">About Us</h3>
            <p className="text-sm">
              DevTogether is a platform connecting developers with non-profits
              to gain real-world experience through meaningful projects. Our
              mission is to empower collaboration and learning.
            </p>
          </div>

          {/* Social Media Links */}
          <div className="mb-8 w-full md:w-1/3 flex justify-end">
            <div>
              <h3 className="text-lg font-bold mb-2">Follow Us</h3>
              <div className="flex space-x-4">
                <a
                  href="https://twitter.com/DevTogether"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-400"
                >
                  <FontAwesomeIcon icon={faTwitter} className="h-6 w-6" />
                </a>
                <a
                  href="https://facebook.com/DevTogether"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-400"
                >
                  <FontAwesomeIcon icon={faFacebook} className="h-6 w-6" />
                </a>
                <a
                  href="https://linkedin.com/company/DevTogether"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-400"
                >
                  <FontAwesomeIcon icon={faLinkedin} className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-600 mt-8 pt-4 text-center">
          <p className="text-sm">&copy; 2025 DevTogether. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
