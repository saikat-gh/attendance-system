import face_recognition
import sys

def compare_faces(image1_path, image2_path):
    try:
        # Load the images
        image1 = face_recognition.load_image_file(image1_path)
        image2 = face_recognition.load_image_file(image2_path)

        # Get the face encodings
        face_encoding1 = face_recognition.face_encodings(image1)
        face_encoding2 = face_recognition.face_encodings(image2)

        if not face_encoding1 or not face_encoding2:
            print("0.0")  # Return 0 if no face is found
            return

        # Compare the first face found in each image
        face_encoding1 = face_encoding1[0]
        face_encoding2 = face_encoding2[0]

        # Calculate the face distance (lower is more similar)
        face_distance = face_recognition.face_distance([face_encoding1], face_encoding2)[0]
        
        # Convert face distance to similarity score (1 - distance for more intuitive scoring)
        similarity_score = 1 - face_distance
        
        # Print just the similarity score
        print(f"{similarity_score:.4f}")

    except Exception as e:
        print(f"An error occurred: {e}")
        print("0.0")  # Return 0 on error

if __name__ == "__main__":
    # Check if correct number of arguments are provided
    if len(sys.argv) != 3:
        print("0.0")
        sys.exit(1)

    # Get image paths from command line arguments
    image1_path = sys.argv[1]
    image2_path = sys.argv[2]

    compare_faces(image1_path, image2_path)
