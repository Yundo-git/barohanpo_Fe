import Image from 'next/image';
import Profile from '@/components/auth/Profile';
import { User } from '@/types/user';

interface UserProfileSectionProps {
  user: User | null;
  onEditProfile: () => void;
}

const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  user,
  onEditProfile,
}) => {
  return (
    <section 
      className="flex pt-3 justify-between items-center cursor-pointer" 
      onClick={onEditProfile}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEditProfile();
        }
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div onClick={(e) => {
            e.stopPropagation();
            onEditProfile();
          }}>
            <Profile
              version={user?.profileImageVersion}
              imageUrl={user?.profileImageUrl}
              alt="사용자 프로필"
              size={56}
              rounded="full"
              className="w-[4.5rem] h-[4.5rem]"
            />
          </div>
        </div>
        <h1 className="T2_SB_20">{user?.nickname || '사용자'}</h1>
      </div>
      <div className="w-6 h-6 relative">
        <Image
          src="/icon/Arrow_Right2.svg"
          alt="프로필 수정"
          fill
          sizes="1.5rem"
          className="object-contain"
          priority
        />
      </div>
    </section>
  );
};

export default UserProfileSection;
