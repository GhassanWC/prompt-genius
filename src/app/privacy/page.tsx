export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-x-hidden">
          {/* Enhanced animated background */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-20%] left-[-15%] w-[60vw] h-[60vw] bg-gradient-to-br from-blue-300/40 via-indigo-300/30 to-purple-300/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-15%] w-[50vw] h-[50vw] bg-gradient-to-tl from-purple-300/30 via-pink-300/20 to-indigo-300/10 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-gradient-to-r from-cyan-200/20 to-blue-200/15 rounded-full blur-2xl animate-pulse delay-500" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            {/* Enhanced header section */}
            <div className="text-center mb-12 sm:mb-16">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-b from-slate-900 via-indigo-800 to-purple-700 bg-clip-text text-transparent mb-4">
                Privacy Policy
              </h1>
              <div className="h-1 w-32 mx-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-60" />
            </div>

            {/* Enhanced content card */}
            <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl shadow-black/5 rounded-2xl p-8 sm:p-10">
              <div className="mb-8">
                <p className="text-lg text-slate-600 font-medium">
                  <strong className="text-slate-800">Effective Date:</strong> August 5, 2025
                </p>
              </div>

              <p className="text-lg text-slate-700 leading-relaxed mb-8">
                This Privacy Policy explains how Prompt Genius AI ("we," "us," or "our") collects, uses, and protects your personal information when you use our services.
              </p>

              <div className="space-y-8">
                <div className="border-l-4 border-indigo-500 pl-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">1. Information We Collect</h2>
                  <p className="text-slate-700 leading-relaxed mb-3">We may collect the following types of personal information:</p>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Account details (e.g., name, email address, password)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Usage data (e.g., pages visited, actions taken, session duration)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Technical data (e.g., IP address, device information, browser type)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Prompts, text input, and other content submitted by you</span>
                    </li>
                  </ul>
                </div>

                <div className="border-l-4 border-indigo-500 pl-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">2. How We Use Your Information</h2>
                  <p className="text-slate-700 leading-relaxed mb-3">We use your information to:</p>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Provide and improve our services</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Generate AI-based development prompts from your inputs</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Personalize your experience</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Communicate with you about updates, offers, or support</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Monitor usage and prevent abuse or fraud</span>
                    </li>
                  </ul>
                </div>

                <div className="border-l-4 border-indigo-500 pl-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">3. Data Sharing</h2>
                  <p className="text-slate-700 leading-relaxed mb-3">We do <strong className="text-red-600">not</strong> sell your personal data. We may share information with:</p>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Service providers who help us operate our platform (e.g., analytics, hosting)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Law enforcement or government agencies if legally required</span>
                    </li>
                  </ul>
                </div>

                <div className="border-l-4 border-indigo-500 pl-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">4. Cookies and Tracking</h2>
                  <p className="text-slate-700 leading-relaxed">We use cookies and similar technologies to analyze site traffic, personalize content, and improve the user experience. You can control cookie settings through your browser.</p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">5. Data Security</h2>
                  <p className="text-slate-700 leading-relaxed">We implement appropriate security measures to protect your information, but no method of transmission over the Internet is 100% secure. Use the Service at your own risk.</p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">6. Your Rights</h2>
                  <p className="text-slate-700 leading-relaxed">You have the right to access, correct, or delete your personal data. To make a request, please contact us at <span className="text-indigo-600 font-medium">support@prompt-genius-ai.com</span>.</p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">7. Third-Party Links</h2>
                  <p className="text-slate-700 leading-relaxed">Our service may contain links to third-party sites. We are not responsible for their privacy practices. Please review their policies before providing any data.</p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">8. Children's Privacy</h2>
                  <p className="text-slate-700 leading-relaxed">We do not knowingly collect information from children under 13. If you believe a child has provided us with personal data, contact us and we will delete it.</p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">9. Changes to This Policy</h2>
                  <p className="text-slate-700 leading-relaxed">We may update this Privacy Policy from time to time. If significant changes are made, we will notify users. Continued use of the Service indicates acceptance of the updated policy.</p>
                </div>

                <div className="border-l-4 border-indigo-500 pl-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">10. Contact Us</h2>
                  <p className="text-slate-700 leading-relaxed">
                    If you have any questions or concerns about this Privacy Policy, contact us at:<br />
                    <span className="text-indigo-600 font-medium">📧 <a href="mailto:support@prompt-genius-ai.com" className="hover:text-indigo-800 transition-colors">support@prompt-genius-ai.com</a></span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
    );
}
