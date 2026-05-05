import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type SettingsInfoModalProps = {
  visible: boolean;
  title: string;
  items: string[];
  onClose: () => void;
};

// Renders inline code markers as styled text.
function renderInlineText(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Text key={`${part}-${index}`} style={styles.inlineCode}>
          {part.slice(1, -1)}
        </Text>
      );
    }

    return part;
  });
}

// Renders one markdown line as native text.
function renderMarkdownLine(line: string, index: number) {
  if (line.trim() === "") {
    return <View key={index} style={styles.blankLine} />;
  }

  if (line.startsWith("# ")) {
    return (
      <Text key={index} style={styles.headingOne}>
        {line.slice(2)}
      </Text>
    );
  }

  if (line.startsWith("## ")) {
    return (
      <Text key={index} style={styles.headingTwo}>
        {line.slice(3)}
      </Text>
    );
  }

  if (line.startsWith("- ")) {
    return (
      <Text key={index} style={styles.item}>
        {"\u2022 "}
        {renderInlineText(line.slice(2))}
      </Text>
    );
  }

  if (/^\d+\. /.test(line)) {
    return (
      <Text key={index} style={styles.item}>
        {renderInlineText(line)}
      </Text>
    );
  }

  return (
    <Text key={index} style={styles.item}>
      {renderInlineText(line)}
    </Text>
  );
}

// Renders markdown text as native views.
function renderMarkdownText(text: string) {
  return text.split("\n").map(renderMarkdownLine);
}

// Renders a full screen settings info modal.
export default function SettingsInfoModal({
  visible,
  title,
  items,
  onClose,
}: SettingsInfoModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>x</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <ScrollView style={styles.content}>
          {items.map((item) => (
            <View key={item}>{renderMarkdownText(item)}</View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    backgroundColor: "white",
  },

  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 12,
  },

  closeText: {
    fontSize: 28,
    fontWeight: "600",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },

  content: {
    flex: 1,
  },

  item: {
    fontSize: 18,
    lineHeight: 25,
    marginBottom: 8,
  },

  headingOne: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },

  headingTwo: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 8,
  },

  inlineCode: {
    backgroundColor: "#eee",
    fontFamily: "monospace",
  },

  blankLine: {
    height: 8,
  },
});
