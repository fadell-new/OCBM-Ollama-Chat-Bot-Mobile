import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { Linking } from 'react-native';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { extractGeneratedFiles, type GeneratedFile } from '@/lib/fileArtifacts';
import { createZipBase64 } from '@/lib/zipFiles';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';

export type GeneratedFilesProps = {
  content: string;
  onCopied?: () => void;
};

export function GeneratedFiles({ content, onCopied }: GeneratedFilesProps) {
  const { theme } = useAppTheme();
  const files = extractGeneratedFiles(content);
  const [preview, setPreview] = useState<GeneratedFile | null>(null);

  if (!files.length) return null;

  const copyFile = async (file: GeneratedFile) => {
    await Clipboard.setStringAsync(file.content);
    onCopied?.();
  };

  const copyAll = async () => {
    const text = files
      .map((file) => `--- file: ${file.name} ---\n${file.content}\n--- end ---`)
      .join('\n\n');
    await Clipboard.setStringAsync(text);
    onCopied?.();
  };

  const saveAndShareZip = async () => {
    try {
      const dir = `${FileSystem.documentDirectory ?? ''}generated/`;
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }

      const base64 = createZipBase64(files);
      const path = `${dir}generated-files-${Date.now()}.zip`;
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const uri = await FileSystem.getContentUriAsync(path);
      const canOpen = await Linking.canOpenURL(uri.toString());
      if (canOpen) {
        await Linking.openURL(uri.toString());
      } else {
        await Linking.openURL(path);
      }
    } catch (error) {
      Alert.alert(
        'Could not save ZIP',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const saveSingleFile = async (file: GeneratedFile) => {
    try {
      const dir = `${FileSystem.documentDirectory ?? ''}generated/`;
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
      const path = `${dir}${file.name}`;
      await FileSystem.writeAsStringAsync(path, file.content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const uri = await FileSystem.getContentUriAsync(path);
      if (await Linking.canOpenURL(uri.toString())) {
        await Linking.openURL(uri.toString());
      } else {
        await Clipboard.setStringAsync(path);
        Alert.alert('File saved', path);
      }
    } catch (error) {
      Alert.alert(
        'Could not save file',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  return (
    <>
      <View
        style={[
          styles.container,
          { borderColor: theme.border, backgroundColor: theme.surfaceAlt },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Generated files ({files.length})
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy all generated files"
            onPress={() => void copyAll()}
            style={styles.headerButton}
          >
            <Text style={[styles.headerAction, { color: theme.accentStrong }]}>
              Copy all
            </Text>
          </Pressable>
        </View>

        {files.map((file) => (
          <View
            key={file.id}
            style={[styles.row, { borderTopColor: theme.border }]}
          >
            <View style={styles.fileInfo}>
              <Text
                style={[styles.fileName, { color: theme.text }]}
                numberOfLines={1}
              >
                {file.name}
              </Text>
              <Text style={[styles.language, { color: theme.textMuted }]}>
                {file.language}
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Copy ${file.name}`}
                onPress={() => void copyFile(file)}
                style={styles.button}
              >
                <Text style={[styles.action, { color: theme.textMuted }]}>
                  Copy
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Preview ${file.name}`}
                onPress={() => setPreview(file)}
                style={styles.button}
              >
                <Text style={[styles.action, { color: theme.textMuted }]}>
                  View
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Save ${file.name}`}
                onPress={() => void saveSingleFile(file)}
                style={styles.button}
              >
                <Text style={[styles.action, { color: theme.textMuted }]}>
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save and share all generated files as ZIP"
            onPress={() => void saveAndShareZip()}
            style={[
              styles.zipButton,
              { backgroundColor: theme.accentStrong },
            ]}
          >
            <Text style={[styles.zipLabel, { color: theme.onAccent }]}>
              Save & open as ZIP
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={preview !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.bg, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {preview?.name}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPreview(null)}
              >
                <Text style={[styles.modalClose, { color: theme.accentStrong }]}>
                  Close
                </Text>
              </Pressable>
            </View>
            <ScrollView>
              <Text
                selectable
                style={[styles.code, { color: theme.text }]}
              >
                {preview?.content}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: typeScale.label,
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
  },
  headerAction: {
    fontFamily: fonts.semibold,
    fontSize: typeScale.caption,
  },
  row: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  fileName: {
    fontFamily: fonts.medium,
    fontSize: typeScale.label,
    flexShrink: 1,
  },
  language: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  button: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  action: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
  },
  footer: {
    paddingTop: spacing.sm,
  },
  zipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.bubble,
    paddingVertical: spacing.sm,
  },
  zipLabel: {
    fontFamily: fonts.semibold,
    fontSize: typeScale.label,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.lg,
    justifyContent: 'center',
  },
  modalCard: {
    maxHeight: '85%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontFamily: fonts.semibold,
    fontSize: typeScale.subtitle,
  },
  modalClose: {
    fontFamily: fonts.semibold,
    fontSize: typeScale.label,
  },
  code: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: 18,
  },
});
