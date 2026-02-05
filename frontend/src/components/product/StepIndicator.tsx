import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  name: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={cn(
              'relative flex-1',
              stepIdx !== steps.length - 1 ? 'pr-4 sm:pr-8' : ''
            )}
          >
            {step.id < currentStep ? (
              // Completed step
              <div className="group flex items-center">
                <span
                  className="flex items-center cursor-pointer"
                  onClick={() => onStepClick?.(step.id)}
                >
                  <span className="step-completed flex h-8 w-8 items-center justify-center rounded-full">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="ml-3 text-sm font-medium text-foreground hidden sm:block">
                    {step.name}
                  </span>
                </span>
              </div>
            ) : step.id === currentStep ? (
              // Current step
              <div className="flex items-center" aria-current="step">
                <span className="step-active flex h-8 w-8 items-center justify-center rounded-full">
                  <span>{step.id}</span>
                </span>
                <span className="ml-3 text-sm font-medium text-primary hidden sm:block">
                  {step.name}
                </span>
              </div>
            ) : (
              // Pending step
              <div className="group flex items-center">
                <span className="step-pending flex h-8 w-8 items-center justify-center rounded-full border-2 border-border">
                  <span>{step.id}</span>
                </span>
                <span className="ml-3 text-sm font-medium text-muted-foreground hidden sm:block">
                  {step.name}
                </span>
              </div>
            )}

            {/* Connector line */}
            {stepIdx !== steps.length - 1 && (
              <div
                className={cn(
                  'absolute top-4 left-0 -ml-px h-0.5 w-full',
                  step.id < currentStep ? 'bg-success' : 'bg-border'
                )}
                style={{ left: '2rem', width: 'calc(100% - 2.5rem)' }}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
