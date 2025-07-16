"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export interface BottomSheetRef {
  reset: () => void;
}

const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  ({ isOpen, onClose, children }, ref) => {
    const resetSheet = useCallback(() => {
      const content = contentRef.current;
      if (content) {
        content.style.transform = "translateY(0)";
        content.style.transition = "transform 0.3s ease-out";
      }
    }, []);
    const sheetRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          sheetRef.current &&
          !sheetRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      }

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen, onClose]);

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
      // 드래그 시작 지점이 핸들 영역인지 확인
      const target = e.target as HTMLElement;
      const isHandle = target.closest(".bottom-sheet-handle") !== null;

      if (!isHandle) return;

      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      setStartY(clientY);
      setCurrentY(clientY);
      setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDragging) return;

      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const deltaY = clientY - startY;
      const newY = Math.max(0, deltaY);
      setCurrentY(clientY);

      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${newY}px)`;
        contentRef.current.style.transition = "none";
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;

      const deltaY = currentY - startY;
      const threshold = 100; // 픽셀 단위의 임계값

      if (deltaY > threshold) {
        onClose();
      } else if (contentRef.current) {
        // 마우스 업 시 확장 상태로 전환
        contentRef.current.style.transform = "translateY(0)";
        contentRef.current.style.transition = "transform 0.3s ease-out";
        contentRef.current.style.height = "100%";
      }

      setIsDragging(false);
    };

    useEffect(() => {
      // 드래그 종료 시 애니메이션 초기화
      const content = contentRef.current;
      if (content && !isDragging) {
        content.style.transform = "translateY(0)";
        content.style.transition = "transform 0.3s ease-out";
      }
    }, [isDragging]);

    useEffect(() => {
      if (sheetRef.current) {
        sheetRef.current.style.height = isOpen ? "auto" : "10rem";
        sheetRef.current.style.opacity = isOpen ? "1" : "0.9";
        sheetRef.current.style.transition =
          "height 0.3s ease, opacity 0.3s ease";
      }
    }, [isOpen]);

    // Expose reset function to parent
    useImperativeHandle(
      ref,
      () => ({
        reset: resetSheet,
      }),
      [resetSheet]
    );

    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    };

    return (
      <div className="fixed inset-0  z-50" onClick={handleOverlayClick}>
        <div className="absolute inset-0" />
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              ref={sheetRef}
              className="fixed bottom-14 left-0 right-0 bg-white rounded-t-lg shadow-lg overflow-y-auto"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "90%", opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                opacity: { duration: 0.2 },
              }}
            >
              <div className="bottom-sheet-handle">
                <div
                  className="flex justify-center mb-4 py-2 cursor-grab active:cursor-grabbing w-full"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleTouchStart}
                  onMouseMove={handleTouchMove}
                  onMouseUp={handleTouchEnd}
                >
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>
              </div>

              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

BottomSheet.displayName = "BottomSheet";

export default BottomSheet;
