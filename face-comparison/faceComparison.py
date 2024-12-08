import cv2
from skimage.metrics import structural_similarity as ssim
import sys

def compute_similarity(frame, reference_image):
    # Load the pre-trained face detector from OpenCV
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Function to detect and extract face from an image
    def extract_face(image):
        gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray_image, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        if len(faces) == 0:
            return None  # No face detected
        # Assume the first detected face is the one we want to compare
        x, y, w, h = faces[0]
        return image[y:y+h, x:x+w]

    # Extract faces from both images
    face_frame = extract_face(frame)
    face_reference = extract_face(reference_image)

    # If either face is not found, return a similarity score of 0
    if face_frame is None or face_reference is None:
        return 0.0

    # Convert the extracted faces to grayscale
    face_frame_gray = cv2.cvtColor(face_frame, cv2.COLOR_BGR2GRAY)
    face_reference_gray = cv2.cvtColor(face_reference, cv2.COLOR_BGR2GRAY)

    # Resize faces to the same size for comparison
    face_frame_gray = cv2.resize(face_frame_gray, (100, 100))
    face_reference_gray = cv2.resize(face_reference_gray, (100, 100))

    # Compute SSIM between the two faces
    score, _ = ssim(face_frame_gray, face_reference_gray, full=True)
    return score

if __name__ == "__main__":
    # Check if correct number of arguments are provided
    if len(sys.argv) != 3:
        print("Error: Please provide two image paths as arguments")
        sys.exit(1)

    # Get image paths from command line arguments
    captured_image_path = sys.argv[1]
    reference_image_path = sys.argv[2]

    try:
        # Load the images
        frame = cv2.imread(captured_image_path)
        reference_image = cv2.imread(reference_image_path)

        if frame is None or reference_image is None:
            print("Error: Could not load one or both images")
            sys.exit(1)

        # Call the function
        similarity_score = compute_similarity(frame, reference_image)
        print(similarity_score)  # Just output the score

    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
