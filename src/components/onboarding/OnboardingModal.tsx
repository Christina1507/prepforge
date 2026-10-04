import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft, GraduationCap, Target, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const { profile, updateProfile } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Academic
  const [name, setName] = useState(profile?.name || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [degree, setDegree] = useState(profile?.degree || 'B.Tech');
  const [branch, setBranch] = useState(profile?.branch || 'Computer Science & Engineering');
  const [gradYear, setGradYear] = useState<number>(profile?.grad_year || 2027);
  const [semester, setSemester] = useState<number>(profile?.semester || 6);

  // Step 2: Career Goals
  const [targetRole, setTargetRole] = useState(profile?.target_role || 'Software Development Engineer (SDE-1)');
  const [targetCompanies, setTargetCompanies] = useState(profile?.target_companies || 'Google, Microsoft, Amazon, Atlassian');
  const [preferredDomain, setPreferredDomain] = useState(profile?.preferred_domain || 'Backend & Distributed Systems');
  const [placementSeason, setPlacementSeason] = useState(profile?.placement_season || 'Campus Placements 2026-2027');
  const [dailyPrepHours, setDailyPrepHours] = useState<number>(profile?.daily_prep_hours || 2.5);

  // Step 3: Preparation Self-Estimate (1 to 5)
  const [dsaLevel, setDsaLevel] = useState<number>(profile?.dsa_level || 3);
  const [aptitudeLevel, setAptitudeLevel] = useState<number>(profile?.aptitude_level || 3);
  const [coreCsLevel, setCoreCsLevel] = useState<number>(profile?.core_cs_level || 3);
  const [programmingLevel, setProgrammingLevel] = useState<number>(profile?.programming_level || 3);
  const [sqlLevel, setSqlLevel] = useState<number>(profile?.sql_level || 3);
  const [communicationLevel, setCommunicationLevel] = useState<number>(profile?.communication_level || 3);
  const [interviewLevel, setInterviewLevel] = useState<number>(profile?.interview_level || 3);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setLoading(true);
    try {
      await updateProfile({
        name,
        college,
        degree,
        branch,
        grad_year: gradYear,
        semester,
        target_role: targetRole,
        target_companies: targetCompanies,
        preferred_domain: preferredDomain,
        placement_season: placementSeason,
        daily_prep_hours: dailyPrepHours,
        dsa_level: dsaLevel,
        aptitude_level: aptitudeLevel,
        core_cs_level: coreCsLevel,
        programming_level: programmingLevel,
        sql_level: sqlLevel,
        communication_level: communicationLevel,
        interview_level: interviewLevel,
        onboarding_completed: 1,
      });
      onComplete();
    } catch (err) {
      console.error('Failed to save onboarding:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header / Stepper */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Onboarding Step {step} of 3
            </span>
            <span className="text-xs text-stone-500 font-mono">
              {step === 1 ? 'Academic Info' : step === 2 ? 'Career Goals' : 'Preparation Assessment'}
            </span>
          </div>
          <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-stone-900 dark:bg-white h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 mb-2">
                <GraduationCap className="w-5 h-5 text-foreground" />
                <h3 className="text-base font-semibold text-foreground">
                  Academic Information
                </h3>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    College / University
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. National Institute of Tech"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Degree
                  </label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="e.g. B.Tech / B.E. / M.C.A."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Branch / Specialization
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    value={gradYear}
                    onChange={(e) => setGradYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Current Semester
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 mb-2">
                <Target className="w-5 h-5 text-foreground" />
                <h3 className="text-base font-semibold text-foreground">
                  Career Goals & Availability
                </h3>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Development Engineer (SDE-1)"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Target Companies (comma separated)
                </label>
                <input
                  type="text"
                  value={targetCompanies}
                  onChange={(e) => setTargetCompanies(e.target.value)}
                  placeholder="e.g. Google, Microsoft, Amazon, Stripe"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Preferred Domain
                  </label>
                  <input
                    type="text"
                    value={preferredDomain}
                    onChange={(e) => setPreferredDomain(e.target.value)}
                    placeholder="e.g. Backend, Full-Stack, Systems"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Placement Season
                  </label>
                  <input
                    type="text"
                    value={placementSeason}
                    onChange={(e) => setPlacementSeason(e.target.value)}
                    placeholder="e.g. Fall 2026 Campus Placement"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Daily Available Preparation Time (Hours): <span className="font-mono">{dailyPrepHours}h</span>
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={6}
                  step={0.5}
                  value={dailyPrepHours}
                  onChange={(e) => setDailyPrepHours(Number(e.target.value))}
                  className="w-full accent-stone-900 dark:accent-white"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>30 mins</span>
                  <span>2.5 hours</span>
                  <span>6 hours</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 mb-2">
                <Award className="w-5 h-5 text-foreground" />
                <h3 className="text-base font-semibold text-foreground">
                  Initial Preparation Assessment
                </h3>
              </div>
              <p className="text-xs text-stone-500">
                Estimate your baseline confidence (1: Beginner, 3: Intermediate, 5: Mastered). This initializes your customized dashboard metrics.
              </p>

              {[
                { label: 'DSA & Algorithms', value: dsaLevel, set: setDsaLevel },
                { label: 'Aptitude & Logical Reasoning', value: aptitudeLevel, set: setAptitudeLevel },
                { label: 'Core CS (OS, DBMS, CN)', value: coreCsLevel, set: setCoreCsLevel },
                { label: 'Programming & OOP', value: programmingLevel, set: setProgrammingLevel },
                { label: 'SQL Practice', value: sqlLevel, set: setSqlLevel },
                { label: 'Communication & Verbal', value: communicationLevel, set: setCommunicationLevel },
                { label: 'Interview Preparation', value: interviewLevel, set: setInterviewLevel },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-2.5 rounded-lg bg-white dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/80">
                  <span className="text-xs font-medium text-foreground">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => item.set(num)}
                        className={`w-7 h-7 text-xs font-semibold rounded-md transition-colors ${
                          item.value === num
                            ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                            : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-border bg-stone-50/50 dark:bg-stone-900/30 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-stone-900 text-white dark:bg-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete Onboarding</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
