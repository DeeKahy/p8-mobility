import SettingsInfoModal from "./SettingsInfoModal";
import { helpItems } from "../utils/helpItems";

type HelpItemsProps = {
  visible: boolean;
  onClose: () => void;
};

// Renders the help items modal.
export default function HelpItems({ visible, onClose }: HelpItemsProps) {
  return (
    <SettingsInfoModal
      visible={visible}
      title="Help"
      items={helpItems}
      onClose={onClose}
    />
  );
}
