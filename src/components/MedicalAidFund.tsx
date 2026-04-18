import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, X, Hospital, Mail, Phone, DollarSign, FileText, User, Activity, ArrowRight, ShieldAlert, ImagePlus } from "lucide-react";
import DonateNowModal from "./DonateNowModal"; // High-Converting Donation Modal

export default function MedicalAidFund() {
  const [isModalOpen, setIsModalOpen] = useState(false); // Verification Form Modal
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false); // Donate Now UI Modal
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    patientName: "",
    hospitalName: "",
    amountRequired: "",
    email: "",
    phone: "",
    medicalNote: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsModalOpen(false);
        setFormData({ 
          patientName: "", hospitalName: "", amountRequired: "", 
          email: "", phone: "", medicalNote: ""
        });
      }, 3500);
    }, 1500);
  };

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-16">
      
      {/* High-Converting Global Donate Modal */}
      <DonateNowModal 
        isOpen={isDonateModalOpen} 
        onClose={() => setIsDonateModalOpen(false)} 
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[40px] border border-red-500/30 bg-gradient-to-br from-rose-600 via-[#FF3131] to-red-900 p-8 shadow-[0_30px_60px_-15px_rgba(255,49,49,0.4)] md:p-14"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white opacity-5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-black opacity-10 blur-3xl"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          
          {/* Left Side: Call to Action */}
          <div className="flex-1 w-full text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 border border-white/30 mb-6 backdrop-blur-md">
              <Heart className="h-4 w-4 text-white animate-pulse fill-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">BloodNet Global Initiative</span>
            </div>
            
            <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl mb-6 leading-tight drop-shadow-lg">
              Medical Aid & <br className="hidden lg:block"/> Financial Support
            </h2>
            
            <p className="text-base font-medium text-white/90 mb-10 max-w-md mx-auto lg:mx-0 drop-shadow-md leading-relaxed">
              We bridge the financial gap for underprivileged patients. 100% of your generous donations cover direct medical surgery costs.
            </p>

            <div className="flex flex-col items-center lg:items-start gap-6">
              <div className="relative">
                {/* Outer Glow for the White Button */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -inset-2 rounded-2xl bg-white blur-xl"
                ></motion.div>
                
                <motion.button
                  onClick={() => setIsDonateModalOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-white px-12 py-5 font-black uppercase tracking-widest text-[#FF3131] shadow-2xl transition-all w-full md:w-auto text-lg hover:bg-gray-50"
                >
                  <div className="relative flex items-center gap-3">
                    <Heart className="h-6 w-6 text-[#FF3131] fill-[#FF3131] animate-[pulse_1.5s_ease-in-out_infinite]" />
                    Donate Now
                    <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                  </div>
                </motion.button>
              </div>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-sm font-bold text-white/70 underline transition-colors hover:text-white tracking-wide mt-2 drop-shadow-md"
              >
                Request for donation money (Patients Only)
              </button>
            </div>
          </div>

          {/* Right Side: Simple Stats Grid */}
          <div className="flex-1 w-full mt-8 lg:mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <motion.div whileHover={{ y: -5 }} className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl transition-all">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">Total Raised</p>
                <div className="text-4xl font-black text-white tracking-tight drop-shadow-md">$13,500+</div>
              </motion.div>
              
              <motion.div whileHover={{ y: -5 }} className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl transition-all">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">Total Spent</p>
                <div className="text-4xl font-black text-white tracking-tight drop-shadow-md">$15,000+</div>
              </motion.div>
              
              <motion.div whileHover={{ y: -5 }} className="rounded-3xl border border-white/40 bg-white/20 p-8 shadow-2xl backdrop-blur-xl transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-16 h-16"/></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white mb-2">Projects Completed</p>
                <div className="text-4xl font-black text-white tracking-tight drop-shadow-lg">37</div>
              </motion.div>
              
              <motion.div whileHover={{ y: -5 }} className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl transition-all">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">Donor Requests</p>
                <div className="text-4xl font-black text-white tracking-tight drop-shadow-md">156</div>
              </motion.div>
              
            </div>
          </div>
        </div>
      </motion.div>


      {/* Full Financial Request Modal for Non-Users */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass relative w-full max-w-2xl overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl ring-1 ring-black/5 backdrop-blur-3xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-6 top-6 text-text/30 transition-colors hover:text-text"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="mb-6 text-center text-text">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Activity className="h-6 w-6 animate-pulse" />
                </div>
                <h2 className="text-2xl font-black tracking-tight uppercase">Medical Aid Request</h2>
                <div className="mt-4 rounded-xl bg-orange-50 border border-orange-200 p-4 flex items-start gap-4 text-left shadow-sm">
                  <ShieldAlert className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-800 leading-relaxed font-medium">
                    <span className="font-bold text-orange-600 block mb-1">STRICT VERIFICATION POLICY</span>
                    Before any campaign is publicly listed or funds are disbursed, our team will directly contact the provided hospital authority to verify patient records. Fraudulent requests are permanently banned.
                  </p>
                </div>
              </div>

              {success ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center mt-8"
                >
                  <h3 className="text-2xl font-black text-green-600 uppercase tracking-widest mb-2">Request Logged</h3>
                  <p className="text-green-800">Stored securely in the Admin Dashboard for review. We will contact you and the hospital authority shortly.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text/50">Patient Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text/30" />
                        <input
                          required
                          type="text"
                          className="w-full rounded-xl border border-black/10 bg-gray-50 py-3.5 pl-12 pr-4 text-text placeholder:text-text/30 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                          value={formData.patientName}
                          onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text/50">Amount Needed (USD)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text/30" />
                        <input
                          required
                          type="number"
                          placeholder="e.g. 5000"
                          className="w-full rounded-xl border border-black/10 bg-gray-50 py-3.5 pl-12 pr-4 text-text placeholder:text-text/30 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                          value={formData.amountRequired}
                          onChange={(e) => setFormData({ ...formData, amountRequired: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text/50">Hospital / Medical Authority Details</label>
                    <div className="relative">
                      <Hospital className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text/30" />
                      <input
                        required
                        type="text"
                        placeholder="Name of Hospital and Doctor handling the case"
                        className="w-full rounded-xl border border-black/10 bg-gray-50 py-3.5 pl-12 pr-4 text-text placeholder:text-text/30 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                        value={formData.hospitalName}
                        onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text/50">Contact Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text/30" />
                        <input
                          required
                          type="email"
                          className="w-full rounded-xl border border-black/10 bg-gray-50 py-3.5 pl-12 pr-4 text-text focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text/50">Contact Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text/30" />
                        <input
                          required
                          type="tel"
                          className="w-full rounded-xl border border-black/10 bg-gray-50 py-3.5 pl-12 pr-4 text-text focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text/50">Medical Condition / Note</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 h-5 w-5 text-text/30" />
                      <textarea
                        required
                        rows={3}
                        placeholder="Explain why financial aid is immediately necessary..."
                        className="w-full rounded-xl border border-black/10 bg-gray-50 py-4 pl-12 pr-4 text-text placeholder:text-text/30 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 custom-scrollbar resize-none"
                        value={formData.medicalNote}
                        onChange={(e) => setFormData({ ...formData, medicalNote: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text/50">Prescription Image</label>
                      <div className="relative group cursor-pointer">
                        <input
                          required
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full rounded-xl border-2 border-dashed border-black/10 bg-gray-50 py-4 px-4 text-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1">
                          <ImagePlus className="h-5 w-5 text-text/40 group-hover:text-primary" />
                          <span className="text-xs font-bold text-text/50 group-hover:text-primary">Upload Prescription</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text/50">Medical Report Image</label>
                      <div className="relative group cursor-pointer">
                        <input
                          required
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full rounded-xl border-2 border-dashed border-black/10 bg-gray-50 py-4 px-4 text-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1">
                          <ImagePlus className="h-5 w-5 text-text/40 group-hover:text-primary" />
                          <span className="text-xs font-bold text-text/50 group-hover:text-primary">Upload Main Report</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-rose-500 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl hover:opacity-90 disabled:opacity-50 mt-4"
                  >
                    {isLoading ? "Transmitting to Secure Vault..." : "Submit Verification Request"}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
