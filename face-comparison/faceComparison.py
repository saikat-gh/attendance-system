import cv2
from skimage.metrics import structural_similarity as ssim

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

    # Resize faces to the same size for comparison (optional but recommended)
    face_frame_gray = cv2.resize(face_frame_gray, (100, 100))
    face_reference_gray = cv2.resize(face_reference_gray, (100, 100))

    # Compute SSIM between the two faces
    score, _ = ssim(face_frame_gray, face_reference_gray, full=True)
    return score







# Load the images
frame = cv2.imread('uploads/saikat.jpg')  # Replace with your image path
reference_image = cv2.imread('uploads/sm-white.png')  # Replace with your image path

# Call the function
similarity_score = compute_similarity(frame, reference_image)

print(f"Similarity Score: {similarity_score}")