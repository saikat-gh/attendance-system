import face_recognition

def compare_faces(image1_path, image2_path):
    try:
        # Load the images
        image1 = face_recognition.load_image_file(image1_path)
        image2 = face_recognition.load_image_file(image2_path)

        # Get the face encodings
        face_encoding1 = face_recognition.face_encodings(image1)
        face_encoding2 = face_recognition.face_encodings(image2)

        if not face_encoding1 or not face_encoding2:
            print("Could not find a face in one or both images.")
            return

        # Compare the first face found in each image
        face_encoding1 = face_encoding1[0]
        face_encoding2 = face_encoding2[0]

        # Calculate the face distance (lower is more similar)
        face_distance = face_recognition.face_distance([face_encoding1], face_encoding2)[0]
        result = face_recognition.compare_faces([face_encoding1], face_encoding2)[0]

        if result:
            print(f"The faces match! (Face distance: {face_distance:.4f})")
        else:
            print(f"The faces do not match. (Face distance: {face_distance:.4f})")

    except Exception as e:
        print(f"An error occurred: {e}")

# Example usage
# Replace with the paths to your images
image1_path = "uploads/1732634792224.jpg"
image2_path = "uploads/1729781545897.jpg"

compare_faces(image1_path, image2_path)
