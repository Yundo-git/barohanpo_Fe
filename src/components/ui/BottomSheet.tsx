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
  /** 오버레이 클릭으로 닫기 가능 여부 */
  closeOnOverlay?: boolean; // default true
  /** ESC 키로 닫기 가능 여부 */
  closeOnEsc?: boolean; // default true
  /** 접근성을 위한 레이블 */
  ariaLabel?: string; // default "바텀시트"
  onDragUp?: () => void;
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
      onDragUp,
    },
    ref
  ) => {
    const panelRef = useRef<HTMLDivElement | null>(null);
    const scrollableRef = useRef<HTMLDivElement | null>(null);
    const lastActiveRef = useRef<HTMLElement | null>(null);

    // reset() 메서드 외부 노출
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

    // 바디 스크롤 잠금 + ESC 키 처리 + 포커스 복원
    useEffect(() => {
      if (!isOpen) return;

      // 나중에 포커스를 복원하기 위해 현재 활성 요소 저장
      lastActiveRef.current = document.activeElement as HTMLElement;

      // 현재 스타일과 스크롤 위치 저장
      const { overflow, position, width, top } = document.body.style;
      const scrollY = window.scrollY;

      // 스크롤 방지를 위한 스타일 적용
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${scrollY}px`;

      // ESC 키로 닫기 처리
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && closeOnEsc) {
          onClose();
        }
      };
      document.addEventListener("keydown", onKeyDown);

      // 바텀시트에 초기 포커스 설정
      requestAnimationFrame(() => {
        panelRef.current?.focus();
      });

      // 정리 함수
      return () => {
        // 이벤트 리스너 제거
        document.removeEventListener("keydown", onKeyDown);

        // 스타일 복원
        document.body.style.overflow = overflow;
        document.body.style.position = position;
        document.body.style.width = width;
        document.body.style.top = top;

        // 스크롤 위치 복원
        window.scrollTo(0, scrollY);

        // 포커스 복원
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
              // 포커스 받을 수 있도록 설정
              tabIndex={-1}
              ref={panelRef}
              // 패널 클릭 시 오버레이로 이벤트가 전파되어 닫히지 않도록 방지
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
              // 드래그로 닫기 동작 처리
              drag="y"
              dragElastic={0.1}
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={(_, info) => {
                const draggedFar = info.offset.y > 120;
                const flungDown = info.velocity.y > 800;

                // Detect upward drag
                if (info.offset.y < -50) {
                  onDragUp?.();
                }

                if (draggedFar || flungDown) onClose();
              }}
            >
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing bottom-sheet-handle select-none">
                <span className="h-1.5 w-12 rounded-full bg-gray-300" />
              </div>

              <div
                ref={scrollableRef}
                className="px-4 pb-4 overflow-y-auto"
                style={{
                  // 핸들 높이만큼 여백을 포함한 후, 내부에서만 스크롤 가능하도록 설정
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
