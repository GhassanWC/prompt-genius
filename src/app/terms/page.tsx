export default function TermsOfServicePage() {
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
              Terms of Service
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-60" />
          </div>

          {/* Enhanced content card */}
          <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl shadow-black/5 rounded-2xl p-8 sm:p-10">
          
            <p className="text-lg text-slate-700 leading-relaxed mb-8">
              Welcome to Prompt Genius AI ("we," "us," or "our"). By accessing or using our website, app, or any services provided (collectively, the "Service"), you ("you" or "User") agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
            </p>

            <div className="space-y-8">
              <div className="border-l-4 border-indigo-500 pl-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">1. Service Description</h2>
                <p className="text-slate-700 leading-relaxed">Prompt Genius AI helps users transform vague ideas into structured development plans by generating step-by-step prompts using artificial intelligence.</p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">2. Eligibility</h2>
                <p className="text-slate-700 leading-relaxed">You must be at least 13 years old to use the Service. By using the Service, you affirm that you meet this requirement and have the legal capacity to enter into these Terms.</p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">3. Account Registration</h2>
                <p className="text-slate-700 leading-relaxed">To access certain features, you may be required to create an account. You agree to provide accurate and complete information and to keep your login credentials secure.</p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">4. Acceptable Use</h2>
                <ul className="list-none space-y-2 text-slate-700">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Use the Service for unlawful or harmful purposes.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Interfere with the operation of the Service or any user's enjoyment of it.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Reverse-engineer, scrape, or attempt to extract the underlying code or algorithms.</span>
                  </li>
                </ul>
              </div>

              <div className="border-l-4 border-indigo-500 pl-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">5. User Content</h2>
                <p className="text-slate-700 leading-relaxed">You retain ownership of any ideas or input you provide, but you grant us a non-exclusive, royalty-free license to use that input for the purpose of generating outputs and improving our Service.</p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">6. AI-Generated Output</h2>
                <p className="text-slate-700 leading-relaxed">You understand and agree that AI-generated outputs are not guaranteed to be accurate, complete, or suitable for any specific purpose. You are solely responsible for how you use the content generated by Prompt Genius AI.</p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">7. Intellectual Property</h2>
                <p className="text-slate-700 leading-relaxed">All content, code, branding, and technology associated with Prompt Genius AI (excluding User Content) are our intellectual property. You may not use, copy, or distribute it without our written permission.</p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">8. Payments and Subscriptions (if applicable)</h2>
                <p className="text-slate-700 leading-relaxed">Some features may be offered on a paid basis. By subscribing, you agree to the pricing, payment, and renewal terms shown at the time of purchase.</p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">9. Termination</h2>
                <p className="text-slate-700 leading-relaxed">We may suspend or terminate your account at any time if you violate these Terms or use the Service in a harmful way. You may also delete your account at any time.</p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">10. Disclaimer</h2>
                <p className="text-slate-700 leading-relaxed">The Service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted operation, data accuracy, or fitness for a particular purpose.</p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">11. Limitation of Liability</h2>
                <p className="text-slate-700 leading-relaxed">To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the Service.</p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">12. Changes to Terms</h2>
                <p className="text-slate-700 leading-relaxed">We reserve the right to update these Terms at any time. If we make significant changes, we'll notify you. Continued use of the Service constitutes acceptance of the new Terms.</p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">13. Contact</h2>
                <p className="text-slate-700 leading-relaxed">
                  If you have any questions about these Terms, contact us at:<br />
                  <span className="text-indigo-600 font-medium">📧 <a href="mailto:support@prompt-genius-ai.com" className="hover:text-indigo-800 transition-colors">support@prompt-genius-ai.com</a></span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
  