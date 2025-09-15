"use client";

import { XMarkIcon } from "@heroicons/react/24/solid";

export default function FavoriteListModal({
    isOpen,
    onClose,
    userId,
}: {
    isOpen: boolean;
    onClose: () => void;
    userId: number;
}) {

    if (!isOpen) return null;
    console.log(userId);

    return (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
            </button>
            <h1>찜 목록</h1>
            
            
        </div>
    );
}