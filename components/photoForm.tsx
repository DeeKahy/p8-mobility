import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
//Expected photo data format to make it easier to pass over including only the most necessary. Also works in unison with yup validator.
import { View, Image, TextInput, Button, Text, Modal } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import * as yup from 'yup';

import { styles } from '../app/css/photoForm';
import { PhotoForm } from '../app/models/PhotoFormModel';
//Photo form to take data from index.tsx and opening and closing modal
type PhotoFormProps = {
  visible: boolean;
  onClose: () => void;
  photoUri: string;
  dateTaken: string;
  onSubmit: (data: PhotoForm) => void;
};

//Form validator
const schema = yup
  .object({
    photoUri: yup.string().required('Photo is required'),
    areaGroup: yup.string().required('Area group is required'),
    pictureName: yup.string().required('Picture name is required'),
    dateTaken: yup.string().required('Date is required'),
  })
  .required();

export default function PhotoFormModal({
  visible,
  onClose,
  photoUri,
  dateTaken,
  onSubmit,
}: PhotoFormProps) {
  const [open, setOpen] = useState(false);
  const [showOtherInputForm, setShowOtherInputForm] = useState(false);

  //Is used for controlling variables (e.g. when we update a value the yup resolver will take note of that).
  //Also for including errors in yup validator based on schema provided above, and also handling submit button.
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PhotoForm>({
    // Specififying what our form is gonna look like
    defaultValues: {
      photoUri: '',
      dateTaken: '',
      pictureName: '',
      areaGroup: '',
    },
    resolver: yupResolver(schema),
  });

  //Works similar to just having useState, but is integrated into useForm()
  setValue('dateTaken', dateTaken);
  setValue('photoUri', photoUri);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.container}>
        <View style={styles.formCard}>
          <Text>Picture:</Text>
          <View style={styles.imageContainer}>
            <Image source={{ uri: photoUri }} style={styles.image} />
          </View>
          {errors.photoUri && (
            <Text style={styles.error}>{errors.photoUri.message}</Text>
          )}

          <Text>Picture name:</Text>
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
          {errors.pictureName && (
            <Text style={styles.error}>{errors.pictureName.message}</Text>
          )}

          <Text>Area group:</Text>
          <Controller
            control={control}
            name="areaGroup"
            render={({ field: { onChange, value } }) => (
              <View>
                <DropDownPicker
                  open={open}
                  value={value}
                  items={[
                    { label: 'Kitchen', value: 'Kitchen' },
                    { label: 'Living Room', value: 'Living Room' },
                    { label: 'Bathroom', value: 'Bathroom' },
                    { label: 'Bedroom', value: 'Bedroom' },
                    { label: 'Other', value: 'Other' },
                  ]}
                  setOpen={setOpen}
                  setValue={(currentValue) => {
                    const newValue = currentValue(value);
                    setShowOtherInputForm(newValue === 'Other');
                    onChange(newValue);
                  }}
                  placeholder="Select area group"
                />
                {showOtherInputForm && (
                  <TextInput
                    style={styles.input}
                    placeholder="Other..."
                    onChangeText={onChange}
                  />
                )}
              </View>
            )}
          />
          {errors.areaGroup && (
            <Text style={styles.error}>{errors.areaGroup.message}</Text>
          )}
          <Text>Date:</Text>
          <Controller
            control={control}
            name="dateTaken"
            render={({ field: { value } }) => (
              <TextInput
                style={styles.dateInput}
                value={value}
                placeholder="YYYY-MM-DD"
                editable={false}
              />
            )}
          />
          {errors.dateTaken && (
            <Text style={styles.error}>{errors.dateTaken.message}</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Done"
            onPress={() => {
              handleSubmit(onSubmit)();
              reset();
            }}
          />
          <Button title="Cancel" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
