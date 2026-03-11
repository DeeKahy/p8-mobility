import { useEffect, useState } from 'react';
import { View, Image, TextInput, Button, Text, StyleSheet, Modal } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import DropDownPicker from 'react-native-dropdown-picker';

//Expected photo data format to make it easier to pass over including only the most necessary
type PhotoForm = {
    photoUri: string;
    dateTaken: string;
    pictureName: string;
    areaGroup: string;
};

//Photo form to take data from index.tsx and opening and closing modal
type PhotoFormProps = {
    visible: boolean;
    onClose: () => void;
    photoUri: string;
    dateTaken: string;
    onSubmit: (data: PhotoForm) => void;
};

//Form validator
const schema = yup.object({
    photoUri: yup.string().required('Photo is required'),
    areaGroup: yup.string().required('Area group is required'),
    pictureName: yup.string().required('Picture name is required'),
    dateTaken: yup.string().required('Date is required'),
}).required();

export default function PhotoFormModul({visible, onClose, photoUri, dateTaken, onSubmit}: PhotoFormProps) {
    const [open, setOpen] = useState(false);
    const [showOtherInputForm, setShowOtherInputForm] = useState(false);
    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<PhotoForm>({
        defaultValues: {
            photoUri,
            dateTaken,
            pictureName: '',
            areaGroup: '',
        },
        resolver: yupResolver(schema),
    });

    useEffect (() => {
        if ( dateTaken ) {
            setValue("dateTaken", dateTaken);
            setValue("photoUri", photoUri);
        }
    }, [dateTaken, photoUri])

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
        >
            <View style={styles.container}>
                <View style={styles.formCard}>
                    <Text>Picture:</Text>
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: photoUri }} style={styles.image} />
                    </View>
                    {errors.photoUri && <Text style={styles.error}>{errors.photoUri.message}</Text>}

                    <Text>Picture name:</Text>
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
                    {errors.pictureName && <Text style={styles.error}>{errors.pictureName.message}</Text>}

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
                                        { label: 'Other', value: 'Other'},
                                    ]}
                                    setOpen={setOpen}
                                    setValue={(callback) => {
                                        const newValue = callback(value);
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
                    <Text>Date:</Text>
                    <Controller
                        control={control}
                        name="dateTaken"
                        render={({ field: { value } }) => (
                            <TextInput
                                style={styles.dateInput}
                                value={value}
                                placeholder="YYYY-MM-DD"
                                editable= {false}
                            />
                        )}
                    />
                    {errors.dateTaken && <Text style={styles.error}>{errors.dateTaken.message}</Text>}
                </View>

                <View style={styles.buttonContainer}>
                    <Button title="Done" onPress={handleSubmit(onSubmit)} />
                    <Button title="Cancel" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    formCard: {
        borderColor: "#ccc",
        borderRadius: 20,
        padding: 20,
        gap: 15,
    },
    imageContainer: {
        borderColor: "#ccc",
        borderRadius: 20,
        height: 160,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    image: {
        width: 120,
        height: 120,
        resizeMode: "contain",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: "#a6f4d6",
        color: "grey",
        borderRadius: 10,
        padding: 8,
        minWidth: 120,
        textAlign: "center",
    },
    buttonContainer: {
        marginTop: 20,
    },
    error: {
        color: 'red',
        marginBottom: 5,
    },
});