import { useRef, useCallback } from "react";

// 주소가 화면 가로 길이의 80%를 초과하면 줄바꿈을 추가하는 훅
export const useFormatAddress = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 주어진 텍스트가 최대 너비를 초과할 때 줄바꿈을 추가하는 함수
  const formatAddress = useCallback((text: string, maxWidth: number) => {
    if (!text) return text;
    
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.whiteSpace = 'nowrap';
    temp.style.fontSize = '14px';
    document.body.appendChild(temp);
    
    let result = '';
    let currentLine = '';
    
    // 공백을 기준으로 단어 분리
    const words = text.split(' ');
    
    for (const word of words) {
      temp.textContent = currentLine + (currentLine ? ' ' : '') + word;
      
      if (temp.offsetWidth <= maxWidth) {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      } else {
        result += (result ? '\n' : '') + currentLine;
        currentLine = word;
      }
    }
    
    // 마지막 줄 추가
    if (currentLine) {
      result += (result ? '\n' : '') + currentLine;
    }
    
    document.body.removeChild(temp);
    return result || text;
  }, []);

  // 주어진 요소의 너비를 기반으로 주소 포맷팅
  const formatAddressToFit = useCallback((element: HTMLElement | null, text: string) => {
    if (!element || !text) return text;
    
    const parent = element.parentElement;
    if (!parent) return text;
    
    const maxWidth = parent.clientWidth * 0.9;
    return formatAddress(text, maxWidth);
  }, [formatAddress]);

  return { formatAddressToFit };
};
