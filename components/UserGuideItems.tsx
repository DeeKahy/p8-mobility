import SettingsInfoModal from "./SettingsInfoModal";
import { userGuideItems } from "../utils/userGuideItems";

type UserGuideItemsProps = {
  visible: boolean;
  onClose: () => void;
};

// Renders the user guide items modal.
export default function UserGuideItems({
  visible,
  onClose,
}: UserGuideItemsProps) {
  return (
    <SettingsInfoModal
      visible={visible}
      title="User guide"
      items={userGuideItems}
      onClose={onClose}
    />
  );
}
