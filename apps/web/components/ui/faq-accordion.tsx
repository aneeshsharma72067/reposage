'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

type FaqItem = {
  question: string;
  answer: string;
};

const faqItems: FaqItem[] = [
  {
    question: 'How fast does Agentic Workflow process new commits?',
    answer:
      'Most commit events appear in the analysis pipeline within seconds. Processing time depends on diff size and queue depth, but the system is designed for near real-time visibility.',
  },
  {
    question: 'What data does the AI engine use to produce findings?',
    answer:
      'The engine combines webhook metadata, commit diffs, repository history, and health baselines. This context helps reduce false positives and improves recommendation quality.',
  },
  {
    question: 'Do you modify code or push commits automatically?',
    answer:
      'No. Agentic Workflow is analysis-first and read-only for repository code. It surfaces prioritized findings so engineers remain in control of remediation and merge decisions.',
  },
  {
    question: 'Can I track health trends across multiple repositories?',
    answer:
      'Yes. The platform aggregates risk, finding volume, and throughput trends across repositories and teams, making it easier to spot regression patterns over time.',
  },
  {
    question: 'Is this suitable for high-volume engineering organizations?',
    answer:
      'Yes. The architecture is event-driven and built to scale with commit throughput, while still maintaining clear analysis traces and dashboard responsiveness.',
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className="space-y-3">
      {faqItems.map((item, index) => {
        const isOpen = index === openIndex;

        return (
          <article
            key={item.question}
            className="overflow-hidden rounded-xl bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-[8px]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${index}`}
            >
              <span className="text-[0.95rem] font-semibold text-white/92">{item.question}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              >
                <ChevronDown size={14} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={`faq-answer-${index}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <p className="px-4 py-4 text-sm leading-[1.65] text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    {item.answer}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </article>
        );
      })}
    </div>
  );
}
