import { stepTips, StepType, TipCategory } from '../data/stepTips';

export function getStepTip(step: StepType, isOvertime: boolean): string {
  const category: TipCategory = isOvertime ? 'overtime' : 'default';
  const tipList = stepTips[step][category];
  if (!tipList || tipList.length === 0) return '';
  const randomIndex = Math.floor(Math.random() * tipList.length);
  return tipList[randomIndex];
} 