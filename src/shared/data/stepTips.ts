export type StepType = 'sketch' | 'color' | 'detail' | 'finish';
export type TipCategory = 'default' | 'overtime';

export interface StepTipSet {
  [category: string]: string[];
}

export interface StepTips {
  [step: string]: StepTipSet;
}

export const stepTips: StepTips = {
  sketch: {
    default: [
      '주제를 잘 표현할 수 있는 아이디어인지 판단해!',
      '주제부가 가장 눈에 띄어야 해. 전체 비율은 바닥에 놓고 멀리서 한 번 봐봐.',
      '주제부는 디테일하게, 배경은 채색하면서 잡아도 돼.',
    ],
    overtime: [
      '스케치 오래했어. 채색 시간을 아껴야 하니까, 디테일은 다음 단계에서 마무리해!',
    ],
  },
  color: {
    default: [
      '주제부는 맑고 쨍하게! 가장 눈에 들어와야 해.',
      '방금 만든 물감 색으로 바를 수 있는 곳들부터 빠르게 채워!',
      '덩어리감(양감)부터 잡아줘. 초벌은 빠르게, 정확하게!',
      '가장 밝은 화이트 영역은 남겨두고 칠해도 좋아.',
    ],
    overtime: [
      '시간 부족해! 디테일보단 덩어리 먼저. 묘사에서 정리하면 돼.',
    ],
  },
  detail: {
    default: [
      '묘사는 주제부가 가장 디테일해야 해!',
      '질감 표현이 핵심이야. 물성, 표면에 집중해봐.',
      '채색 단계에서 지저분한 부분 정리하면서 묘사해. 두 번 일 하지 마!',
    ],
    overtime: [
      '묘사 너무 오래 했어. 정리할 시간 생각해서 마무리하자.',
    ],
  },
  finish: {
    default: [
      '바닥에 놓고 전체 그림 느낌 한 번 더 봐봐.',
      '지저분한 라인 있으면 깔끔하게 정리!',
      '주제부 아닌 곳이 더 눈에 띈다면, 마카로 눌러줘.',
      '화이트, 블랙을 잘 조절해서 주제부 강조!',
    ],
    overtime: [
      '더 만지면 무너질 수도 있어. 정리하고 멈추자!',
    ],
  },
}; 