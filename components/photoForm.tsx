import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState, useEffect } from "react";
import { useForm, Controller, ControllerRenderProps } from "react-hook-form";
//Expected photo data format to make it easier to pass over including only the most necessary. Also works in unison with yup validator.
import {
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
} from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import * as yup from "yup";

import FloatingHelpButton from "./FloatingHelpButton";
import FullscreenImage from "./FullscreenImage";
import { Overlay, useOverlays } from "../context/Overlays";
import { styles } from "../css/photoForm";
import { styles as listStyles } from "../css/photo_list";
import { PhotoData } from "../models/PhotoFormModel";
import { isImageBlurry } from "../utils/blurDetection";
import { hashNameToColor } from "../utils/stringColor";
//Photo form to take data from index.tsx and opening and closing modal
type PhotoFormProps = {
  visible: boolean;
  onSkip: () => void;
  photoUri: string;
  date: string;
  onSubmit: (data: PhotoData) => void;
};

//Form validator
const schema = yup
  .object({
    photoUri: yup.string().required("Image is required"),
    areaGroup: yup.string().required("Group is required"),
    pictureName: yup.string().required("Image title is required"),
    dateTaken: yup.string().required("Date is required"),
    description: yup.string().default(""),
  })
  .required();

// Generates icons based on item names
const generateIcon = (s: string) => (
  <View
    style={[
      {
        width: 20, // Dynamic sizing doesn't work here
        height: 20,
        borderRadius: "50%",
      },
      s // Highlight the edge if there's no string to get a color with
        ? { backgroundColor: hashNameToColor(s) }
        : { borderWidth: 2, borderColor: "#0000005b" },
    ]}
  />
);

export const PhotoFormModal = ({
  onSkip,
  photoUri,
  date,
  onSubmit,
}: PhotoFormProps) => {
  const [open, setOpen] = useState(false);
  const [showOtherInputForm, setShowOtherInputForm] = useState(false);
  const { showToast } = useOverlays();

  useEffect(() => {
    // To run an async function in a useEffect, we need to define it inside
    const toastBlur = async () => {
      const blurry = await isImageBlurry(photoUri);
      showToast(
        blurry ? "Is the image clear?" : "Image looks sharp!",
        blurry ? "Info" : "Success"
      );
    };
    toastBlur();
  }, []);

  //Is used for controlling variables (e.g. when we update a value the yup resolver will take note of that).
  //Also for including errors in yup validator based on schema provided above, and also handling submit button.
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isLoading, isSubmitting },
  } = useForm<PhotoData>({
    // Specififying what our form is gonna look like
    defaultValues: {
      photoUri,
      dateTaken: date,
      pictureName: "",
      areaGroup: "",
      description: "",
    },
    resolver: yupResolver(schema),
  });

  // Area group names. // TODO: Add the user's own to this if we let them declare some
  const names: string[] = ["Kitchen", "Living Room", "Bathroom", "Bedroom"];

  const makeSimpleItem = (value: string) => ({
    label: value,
    value,
    icon: () => generateIcon(value),
  });

  const [items, setItems] = useState<ItemType<string>[]>(() => {
    return names
      .map((s: string) => makeSimpleItem(s))
      .concat([
        { label: "Other", value: "Other", icon: () => generateIcon("") },
      ]);
  });

  const [fullscreenImage, setFullscreenImage] = useState("");
  return (
    <Overlay
      style={styles.fullscreenOverlay}
      animationType="slide"
      dependencies={[errors, fullscreenImage, items]}
    >
      <FloatingHelpButton />
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ padding: 20 }}
        >
          <View style={styles.formCard}>
            <Text>Tap to enlarge:</Text>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={() => {
                setFullscreenImage(photoUri);
              }}
            >
              <Image source={{ uri: photoUri }} style={styles.image} />
            </TouchableOpacity>
            {errors.photoUri ? (
              <Text style={styles.error}>{errors.photoUri.message}</Text>
            ) : null}

            <Text>Image title:</Text>
            {/* Tracking input using control for the form  */}
            <Controller
              control={control}
              name="pictureName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Picture name..."
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.pictureName ? (
              <Text style={styles.error}>{errors.pictureName.message}</Text>
            ) : null}

            <Text>Group:</Text>
            <Controller
              control={control}
              name="areaGroup"
              render={({ field }) => (
                <GroupPicker field={field} items={items} setItems={setItems} />
              )}
            />
            {errors.areaGroup ? (
              <Text style={styles.error}>{errors.areaGroup.message}</Text>
            ) : null}

            <Text>Description:</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  multiline
                  numberOfLines={5}
                  style={styles.textarea}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            <Text>Date:</Text>
            <Controller
              control={control}
              name="dateTaken"
              render={() => (
                <TextInput
                  style={styles.dateInput}
                  value={date}
                  placeholder="YYYY-MM-DD"
                  editable={false}
                />
              )}
            />
            {errors.dateTaken ? (
              <Text style={styles.error}>{errors.dateTaken.message}</Text>
            ) : null}
          </View>
          <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  listStyles.card,
                  { width: "40%", backgroundColor: "#19ae75" },
                ]}
                disabled={isLoading || isSubmitting}
                onPress={handleSubmit(
                  (data) => {
                    console.log("Submit");
                    onSubmit(data);
                    reset({
                      photoUri,
                      dateTaken: date,
                      pictureName: "",
                      areaGroup: "",
                      description: "",
                    });
                  },
                  (errors) => {
                    console.log("Submit blocked by validation.");
                  }
                )}
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  listStyles.card,
                  { width: "40%", backgroundColor: "#ff3355" },
                ]}
                disabled={isLoading || isSubmitting}
                onPress={() => {
                  onSkip();
                  reset({
                    photoUri,
                    dateTaken: date,
                    pictureName: "",
                    areaGroup: "",
                    description: "",
                  });
                }}
              >
                <Text style={styles.buttonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
      {fullscreenImage ? (
        <FullscreenImage uri={fullscreenImage} setUri={setFullscreenImage} />
      ) : null}
    </Overlay>
  );
};

// We need to separate the group picker from the rest of the form.
// Otherwise, it will reset (and close) when any part of the form is interacted with, as far as I can tell.
interface GroupPickerProps {
  field: ControllerRenderProps<PhotoData, "areaGroup">;
  items: ItemType<string>[];
  setItems: React.Dispatch<React.SetStateAction<ItemType<string>[]>>;
}

const GroupPicker = React.memo(
  ({ field, items, setItems }: GroupPickerProps) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(field.value);
    const [showCustomInput, setShowCustomInput] = useState(false);

    const updateOther = (s: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.label === "Other"
            ? { ...item, icon: () => generateIcon(s) }
            : item
        )
      );
    };

    return (
      <View>
        <DropDownPicker
          open={open}
          value={value}
          items={items}
          setOpen={setOpen}
          setItems={setItems}
          setValue={setValue}
          closeAfterSelecting
          closeOnBackPressed
          listMode="SCROLLVIEW"
          placeholder="Select group..."
          onSelectItem={(item) => {
            if (item.label === "Other") {
              field.onChange("");
            } else {
              field.onChange(item.value);
              if (showCustomInput) updateOther("");
            }
            setShowCustomInput(item.label === "Other");
          }}
        />
        {showCustomInput ? (
          <TextInput
            style={styles.input}
            placeholder="Enter group..."
            value={field.value}
            onChangeText={field.onChange}
            onEndEditing={() => updateOther(field.value)}
          />
        ) : null}
      </View>
    );
  }
);
