"use client"
import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { ref, set } from 'firebase/database';
import { db } from './lib/firebase';

type Question = {
  id: string;
  question: string;
  options: string[];
  type: string;
  description?: string;
};

type Answers = {
  [key: string]: any;
};

const areAllAnswered = (questions: Question[], answers: Answers): boolean => {
  return questions.every(q => answers[q.id] !== null);
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function QuestionerApp() {
  const [currentPage, setCurrentPage] = useState(1);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    establishmentType: null,
    contractWorkers: null,
    totalEmployees: null,
    femaleNightShift: null,
    femaleHazardous: null,
    fixedTermEmployees: null,
    salaryStructure: null,
    tradeUnion: null,
    aggregator: null,
    nightShiftWorking: null,
    gigWorkers: null,
    safetyMeasures: null,
  });

  const [impacts, setImpacts] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);

  const baseQuestions: Question[] = [
    {
      id: 'establishmentType',
      question: 'What is the type of establishment?',
      options: ['Service', 'Factory', 'Mine', 'Oilfield', 'Plantation', 'Port', 'Other'],
      type: 'single',
    },
    {
      id: 'contractWorkers',
      question: 'What is the number of any contract worker employed at this location?',
      options: ['0-19', '20-49', '50-99', '100+'],
      type: 'single',
    },
    {
      id: 'totalEmployees',
      question: 'What is the number of persons employed?',
      options: ['0-9', '10-19', '20-49', '50-99', '100-199', '200-249', '250-299', '300-500', '500-1000', '1000+'],
      type: 'single',
    },
    {
      id: 'femaleNightShift',
      question: 'Whether any female is working from 7PM to 6AM?',
      options: ['Yes', 'No'],
      type: 'single',
    },
    {
      id: 'femaleHazardous',
      question: 'Whether female is employed in hazardous process?',
      options: ['Yes', 'No'],
      type: 'single',
    },
  ];

  const defaultImpacts = [
    'Equal Remuneration: HR and payroll systems must ensure that all workers performing similar work receive equal pay, regardless of sector or category. Universal Minimum Wage Compliance and Timely Salary Disbursement by 7th of each month.',
    'Provide for free annual health checkups for employees. The organisation will empanel approved hospitals/diagnostic centres.',
    'Update the Overtime Policy and Leave Framework: Specify standard daily and weekly working hours. Ensure overtime wages are paid at twice the ordinary rate.',
    'Formal and standardized Employment contracts for all including helpers, loaders, security staff, contract workers.',
  ];

  const getPage2Questions = (): Question[] => {
    const page2Qs: Question[] = [
      {
        id: 'fixedTermEmployees',
        question: 'Whether Fixed Term Employees are employed or intended to be employed?',
        description: "'Fixed term employment' means the engagement of a worker on the basis of a written contract of employment for a fixed period with specific conditions regarding wages and benefits.",
        options: ['Yes', 'No'],
        type: 'single',
      },
      {
        id: 'salaryStructure',
        question: 'Whether the current salary structure allows more than 50% component as allowance other than Basic Pay, Retaining allowance, and dearness allowance?',
        options: ['Yes', 'No'],
        type: 'single',
      },
    ];

    if (answers.femaleNightShift === 'Yes' && answers.femaleHazardous === 'Yes') {
      page2Qs.push({
        id: 'nightShiftWorking',
        question: 'Whether women are working during the night shift from 7PM to 6AM?',
        options: ['Yes', 'No'],
        type: 'single',
      });
    }

    if (answers.establishmentType === 'Service') {
      page2Qs.push({
        id: 'tradeUnion',
        question: 'Whether Trade Union is formed?',
        options: ['Yes', 'No'],
        type: 'single',
      });

      page2Qs.push({
        id: 'aggregator',
        question: 'Whether you are engaged as an aggregator for any delivery service?',
        options: ['Yes', 'No'],
        type: 'single',
      });
    }

    return page2Qs;
  };

  const getPage3Questions = (): Question[] => {
    const page3Qs: Question[] = [];

    if (answers.aggregator === 'Yes') {
      page3Qs.push({
        id: 'gigWorkers',
        question: 'Whether any GIG workers/Unorganised workers are employed?',
        options: ['Yes', 'No'],
        type: 'single',
      });
    }

    if (answers.nightShiftWorking === 'Yes' && answers.femaleNightShift === 'Yes' && answers.femaleHazardous === 'Yes') {
      page3Qs.push({
        id: 'safetyMeasures',
        question: 'What are the safety measures?',
        options: ['Yes', 'No'],
        type: 'single',
      });
    }

    return page3Qs;
  };

  const calculateImpacts = (currentAnswers: Answers): string[] => {
    const newImpacts = [...defaultImpacts];

    if (currentAnswers.fixedTermEmployees === 'Yes') {
      newImpacts.push("Fixed-Term Employment Parity: Review and update existing HR and payroll processes to ensure parity of wages, benefits, and statutory entitlements for fixed-term employees, in alignment with the Code's provisions. Fixed term employment means the engagement of a worker on the basis of a written contract of employment for a fixed period: (a) his hours of work, wages, allowances and other benefits shall not be less than that of a permanent worker doing the same work or work of similar nature; (b) he shall be eligible for all statutory benefits available to a permanent worker proportionately according to the period of service rendered by him; (c) he shall be eligible for gratuity if he renders service under the contract for a period of one year.");
    }

    if (currentAnswers.salaryStructure === 'Yes') {
      newImpacts.push("Salary Structure Adjustments: Companies will need to review and realign salary structures where the basic pay component is set at 50% and the remaining portion comprises allowances. Increase in Statutory Contributions: With the broadened wage base, employer contributions towards Provident Fund, gratuity, and other statutory benefits are expected to rise. HR and payroll teams must proactively plan for these changes, communicate implications to employees, and manage cash flow to ensure smooth compliance.");
    }

    if (['10-19', '20-49', '50-99', '100-199', '200-249', '250-299', '300-500', '500-1000', '1000+'].includes(currentAnswers.totalEmployees)) {
      newImpacts.push('Plan Cash Flow for Gratuity Benefits to FTE');
    }

    if (['300-500', '500-1000', '1000+'].includes(currentAnswers.totalEmployees)) {
      newImpacts.push('SOP for time-bound disciplinary proceedings: Develop and implement a Standard Operating Procedure to ensure completion of disciplinary inquiries/investigations relating to suspended employees within the prescribed timelines (90 days).');
    }

    if (['Factory', 'Mine', 'Oilfield', 'Plantation', 'Port', 'Other'].includes(currentAnswers.establishmentType)) {
      newImpacts.push('Lock-out governance framework: Frame a formal notice format and internal approval process for declaration of lock-outs.');
      newImpacts.push('Strike notice communication mechanism: Update statutory display boards and internal communication systems to inform employees of mandatory notice requirements for strikes.');
    }

    if (['Factory', 'Mine', 'Plantation'].includes(currentAnswers.establishmentType) && ['300-500', '500-1000', '1000+'].includes(currentAnswers.totalEmployees)) {
      newImpacts.push('Plan cash flows for statutory contributions towards the Worker Re-skilling Fund and prepare SOP for retrenchment, including retrenchment compensation equivalent to 15 days\' average pay for every completed year of service.');
    }

    if (currentAnswers.establishmentType === 'Service' && currentAnswers.tradeUnion === 'Yes') {
      newImpacts.push('Lock-out governance framework: Frame a formal notice format and internal approval process for declaration of lock-outs, including compliance with mandatory prior notice and procedural safeguards envisaged under the Code.');
      newImpacts.push('Strike notice communication mechanism: Update statutory display boards and internal communication systems to inform employees of the mandatory notice requirements for strikes, applicable uniformly across establishments once the Code is enforced.');
    }

    if (currentAnswers.nightShiftWorking === 'Yes' && currentAnswers.femaleNightShift === 'Yes' && currentAnswers.femaleHazardous === 'Yes' && currentAnswers.safetyMeasures === 'Yes') {
      newImpacts.push('Review and update the policy for women working in night shift with safety measures with their consent and subject to such conditions relating to safety, holidays and working hours or any other condition to be observed by the employer as may be prescribed by the appropriate Government.');
    }

    if (currentAnswers.establishmentType === 'Service' && currentAnswers.aggregator === 'Yes' && currentAnswers.gigWorkers === 'Yes') {
      newImpacts.push('Plan your cashflows by contributing 1-2% of their annual turnover (Provided that the contribution by an aggregator shall not exceed five per cent. of the amount paid or payable by an aggregator to gig workers and platform workers) for the schemes as prescribed by the Central and State Government. Further, the Central and the State governments will be framing different schemes for the benefit of the workers.');
    }

    if (currentAnswers.establishmentType === 'Factory' && currentAnswers.totalEmployees === '0-9') {
      newImpacts.push('Electronic Registration for all the establishments. Thresholds have been changed for the type of establishments.');
    }

    return newImpacts;
  };

  const handleAnswer = (questionId: string, value: string): void => {
    setAnswers({ ...answers, [questionId]: value });
    setShowError(false);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
    setEmailError('');
  };

  const submitForm = async (): Promise<void> => {
    setIsSubmitting(true);
    const formData = {
      email,
      timestamp: new Date().toISOString(),
      answers,
      impacts,
    };

    try {
      // Clean email for use as database key
      const cleanEmail = email.replace(/[.#$\[\]]/g, '_');
      const submissionId = `${cleanEmail}_${new Date().getTime()}`;

      // Save to Firebase
      await set(ref(db, `submissions/${submissionId}`), formData);

      alert('✅ Form submitted successfully!\n\nEmail: ' + email + '\n\nYour data has been saved.');
      downloadFormAsJSON(formData);
    } catch (error: any) {
      console.error('Firebase submission error:', error);
      alert('❌ Error submitting form.\n\nError: ' + (error?.message || 'Unknown error') + '\n\nCheck console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadFormAsJSON = (formData: any): void => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compliance_assessment_${email}_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleNext = (): void => {
    if (currentPage === 1) {
      if (!email.trim()) {
        setEmailError('Email is required');
        return;
      }
      if (!isValidEmail(email)) {
        setEmailError('Please enter a valid email address');
        return;
      }
    }

    const questionsToCheck = currentPage === 1
      ? baseQuestions
      : currentPage === 2
        ? getPage2Questions()
        : getPage3Questions();

    if (!areAllAnswered(questionsToCheck, answers)) {
      setShowError(true);
      return;
    }

    if (currentPage === 1) {
      setCurrentPage(2);
      setShowError(false);
    } else if (currentPage === 2) {
      const page3Qs = getPage3Questions();
      if (page3Qs.length > 0) {
        setCurrentPage(3);
        setShowError(false);
      } else {
        const finalImpacts = calculateImpacts(answers);
        setImpacts(finalImpacts);
        setCurrentPage(4);
        setShowError(false);
      }
    } else if (currentPage === 3) {
      const finalImpacts = calculateImpacts(answers);
      setImpacts(finalImpacts);
      setCurrentPage(4);
      setShowError(false);
    }
  };

  const handlePrevious = (): void => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setShowError(false);
      setEmailError('');
    }
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-8 text-gray-900">General Information</h2>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="block text-base font-semibold text-gray-800">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email address"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all ${
                    emailError
                      ? 'border-red-500 bg-red-50 focus:border-red-600'
                      : 'border-gray-300 bg-white focus:border-blue-600'
                  }`}
                />
                {emailError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {emailError}
                  </p>
                )}
              </div>

              {baseQuestions.map((q) => (
                <div key={q.id} className="space-y-4">
                  <label className="block text-base font-semibold text-gray-800">{q.question}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((option) => (
                      <label
                        key={option}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          answers[q.id] === option
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={option}
                          checked={answers[q.id] === option}
                          onChange={(e) => handleAnswer(q.id, e.target.value)}
                          className="w-4 h-4 text-blue-600 mr-3"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        const page2Qs = getPage2Questions();
        return (
          <div>
            <h2 className="text-2xl font-bold mb-8 text-gray-900">Employment Details</h2>
            <div className="space-y-8">
              {page2Qs.map((q) => (
                <div key={q.id} className="space-y-4">
                  <div>
                    <label className="block text-base font-semibold text-gray-800">{q.question}</label>
                    {q.description && (
                      <p className="text-sm text-gray-600 mt-2 italic">{q.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((option) => (
                      <label
                        key={option}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          answers[q.id] === option
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={option}
                          checked={answers[q.id] === option}
                          onChange={(e) => handleAnswer(q.id, e.target.value)}
                          className="w-4 h-4 text-blue-600 mr-3"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        const page3Qs = getPage3Questions();
        return (
          <div>
            <h2 className="text-2xl font-bold mb-8 text-gray-900">Additional Information</h2>
            <div className="space-y-8">
              {page3Qs.map((q) => (
                <div key={q.id} className="space-y-4">
                  <label className="block text-base font-semibold text-gray-800">{q.question}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((option) => (
                      <label
                        key={option}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          answers[q.id] === option
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={option}
                          checked={answers[q.id] === option}
                          onChange={(e) => handleAnswer(q.id, e.target.value)}
                          className="w-4 h-4 text-blue-600 mr-3"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Compliance Recommendations</h2>
            </div>
            <p className="text-gray-600 mb-4">Submitted by: <span className="font-semibold text-gray-900">{email}</span></p>
            <p className="text-gray-600 mb-8">Based on your responses, here are the compliance requirements and actions you need to implement:</p>
            <div className="space-y-4">
              {impacts.map((impact, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex gap-3">
                    <span className="text-blue-600 font-bold text-lg mt-1">{index + 1}.</span>
                    <p className="text-gray-800 text-sm leading-relaxed">{impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full">
        <div className="bg-white shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">Labor Code Compliance Assessment</h1>
          </div>

          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-700">Progress</span>
              <span className="text-sm font-bold text-blue-600">Step {currentPage} of 4</span>
            </div>
            <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentPage / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {showError && (
            <div className="mx-8 mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800">Required Fields Missing</p>
                <p className="text-sm text-red-700">Please answer all questions before proceeding to the next step.</p>
              </div>
            </div>
          )}

          <div className="px-8 py-8 min-h-[500px]">
            {renderPageContent()}
          </div>

          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`flex items-center px-6 py-2.5 rounded-lg font-semibold transition-all ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
              }`}
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </button>

            {currentPage === 4 ? (
              <button
                onClick={submitForm}
                disabled={isSubmitting}
                className="flex items-center px-8 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit & Download'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}