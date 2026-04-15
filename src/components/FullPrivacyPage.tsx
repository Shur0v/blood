import React from "react";
import { motion } from "motion/react";
import { Shield, Lock, Eye, FileCheck, Info } from "lucide-react";

/**
 * GOOGLE ADSENSE COMPLIANT PAGE (/privacy-policy)
 * Required for AdSense Approval. 
 * Implements standard legal boilerplate + HemaFlow specific logic.
 */
export const FullPrivacyPage = () => {
  return (
    <main className="min-h-screen bg-bg font-inter text-gray-800">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-xs font-black uppercase tracking-[4px] text-primary">Compliance</span>
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 md:text-6xl mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl">
            Last updated: April 11, 2026. This policy describes how HemaFlow collects, uses, and protects your data to ensure a safe donation environment.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-20">
        <div className="grid gap-16">
          
          <Section 
            icon={<Info className="h-5 w-5" />}
            title="1. Introduction"
            content="At HemaFlow, accessible from our platform, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by HemaFlow and how we use it."
          />

          <Section 
            icon={<Lock className="h-5 w-5" />}
            title="2. Log Files & Cookies"
            content={
              <div className="space-y-4">
                <p>HemaFlow follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.</p>
                <p><strong>Google DoubleClick DART Cookie:</strong> Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our platform and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy.</p>
              </div>
            }
          />

          <Section 
            icon={<Eye className="h-5 w-5" />}
            title="3. Third-Party Privacy Policies"
            content="HemaFlow's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options."
          />

          <Section 
            icon={<Shield className="h-5 w-5" />}
            title="4. Data Protection (GDPR/CCPA)"
            content={
              <div className="space-y-4">
                <p>We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>The right to access:</strong> You have the right to request copies of your personal data.</li>
                  <li><strong>The right to rectification:</strong> You have the right to request that we correct any information you believe is inaccurate.</li>
                  <li><strong>The right to erasure:</strong> You have the right to request that we erase your personal data, under certain conditions.</li>
                  <li><strong>The right to restrict processing:</strong> You have the right to request that we restrict the processing of your personal data.</li>
                </ul>
              </div>
            }
          />

          <Section 
            icon={<AlertTriangle className="h-5 w-5" />}
            title="5. Medical Disclaimer"
            content="HemaFlow is a matching platform and NOT a medical provider. We do not provide medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or donation process."
          />

          <Section 
            icon={<FileCheck className="h-5 w-5" />}
            title="6. Consent"
            content="By using our platform, you hereby consent to our Privacy Policy and agree to its Terms and Conditions."
          />

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm text-gray-400">
            © 2026 HemaFlow. All rights reserved. Built for life-saving connections.
          </p>
        </div>
      </footer>
    </main>
  );
};

function Section({ icon, title, content }: { icon: React.ReactNode, title: string, content: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="text-primary">{icon}</div>
        <h2 className="text-xl font-black tracking-tight text-gray-900 uppercase">{title}</h2>
      </div>
      <div className="text-gray-600 leading-relaxed text-base font-medium">
        {content}
      </div>
    </motion.section>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
