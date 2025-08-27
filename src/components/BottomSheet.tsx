// src/components/BottomSheet.tsx
"use client";

import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export interface BottomSheetRef {
  reset: () => void;
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 스크린 대비 최대 높이 (vh). 컨텐츠가 더 작으면 그만큼만 차지 */
  maxHeightVh?: number; // default 85
  /** 오버레이 클릭으로 닫기 */
  closeOnOverlay?: boolean; // default true
  /** ESC 키로 닫기 */
  closeOnEsc?: boolean; // default true
  /** 접근성 레이블 */
  ariaLabel?: string; // default "바텀시트"
}

const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      isOpen,
      onClose,
      children,
      maxHeightVh = 85,
      closeOnOverlay = true,
      closeOnEsc = true,
      ariaLabel = "바텀시트",
    },
    ref
  ) => {
    const panelRef = useRef<HTMLDivElement | null>(null);
    const scrollableRef = useRef<HTMLDivElement | null>(null);
    const lastActiveRef = useRef<HTMLElement | null>(null);

    // expose reset()
    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          if (scrollableRef.current) {
            scrollableRef.current.scrollTop = 0;
          }
        },
      }),
      []
    );

    // Body scroll lock + ESC + focus restore
    useEffect(() => {
      if (!isOpen) return;

      // Save current active element to restore focus later
      lastActiveRef.current = document.activeElement as HTMLElement;

      // Save current styles and scroll position
      const { overflow, position, width, top } = document.body.style;
      const scrollY = window.scrollY;

      // Apply styles to prevent scrolling
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${scrollY}px`;

      // ESC to close
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && closeOnEsc) {
          onClose();
        }
      };
      document.addEventListener("keydown", onKeyDown);

      // Initial focus to sheet
      requestAnimationFrame(() => {
        panelRef.current?.focus();
      });

      // Cleanup function
      return () => {
        // Remove event listener
        document.removeEventListener("keydown", onKeyDown);

        // Restore styles
        document.body.style.overflow = overflow;
        document.body.style.position = position;
        document.body.style.width = width;
        document.body.style.top = top;

        // Restore scroll position
        window.scrollTo(0, scrollY);

        // Restore focus
        lastActiveRef.current?.focus?.();
      };
    }, [isOpen, onClose, closeOnEsc]);

    if (typeof document === "undefined") return null;

    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 bottom-14 w-full z-[1000]"
            aria-hidden={!isOpen}
            // 컨테이너 자체는 포인터 이벤트 허용
          >
            {/* Overlay */}
            <motion.button
              type="button"
              aria-label="닫기"
              className="absolute w-full inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeOnOverlay ? onClose : undefined}
            />

            {/* Panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
              // 포커스 받을 수 있도록
              tabIndex={-1}
              ref={panelRef}
              // 패널 클릭이 오버레이로 전파되어 닫히지 않게
              onClick={(e) => e.stopPropagation()}
              className={[
                "absolute inset-x-0 bottom-0  w-full ",
                "rounded-t-2xl bg-white",
                "pb-[env(safe-area-inset-bottom)]",
              ].join(" ")}
              style={{
                // 컨텐츠 높이만큼 차지하다가, 최대 높이를 넘기면 내부 스크롤
                maxHeight: `calc(${maxHeightVh}vh)`,
              }}
              initial={{ y: "100%", opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
              }}
              // 드래그로 닫기
              drag="y"
              dragElastic={0.1}
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={(_, info) => {
                const draggedFar = info.offset.y > 120; // 드래그 거리 임계값
                const flungDown = info.velocity.y > 800; // 플링 속도 임계값
                if (draggedFar || flungDown) onClose();
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing bottom-sheet-handle select-none">
                <span className="h-1.5 w-12 rounded-full bg-gray-300" />
              </div>

              {/* Scrollable content */}
              <div
                ref={scrollableRef}
                className="px-4 pb-4 overflow-y-auto"
                style={{
                  // handle 높이만큼 여백 포함 후, 내부에서만 스크롤
                  maxHeight: `calc(${maxHeightVh}vh - 2.5rem)`,
                }}
              >
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);

BottomSheet.displayName = "BottomSheet";
export default BottomSheet;
