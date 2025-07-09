import { getStepTip } from '../shared/utils/tipUtils';
import { StepType } from '../shared/data/stepTips';

interface StepTipProps {
  step: StepType;
  isOvertime: boolean;
}

export function StepTip({ step, isOvertime }: StepTipProps) {
  const tip = getStepTip(step, isOvertime);
  return (
    <p className="text-sm text-muted-foreground italic">{tip}</p>
  );
} 