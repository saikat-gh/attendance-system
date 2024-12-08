import cv2
import numpy as np

def compare_faces(image1_path, image2_path):
    # Load the images
    image1 = cv2.imread(image1_path)
    image2 = cv2.imread(image2_path)

    # Convert images to grayscale for face detection
    gray1 = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)

    # Load Haar Cascade for face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Detect faces in the images
    faces1 = face_cascade.detectMultiScale(gray1, scaleFactor=1.1, minNeighbors=5)
    faces2 = face_cascade.detectMultiScale(gray2, scaleFactor=1.1, minNeighbors=5)

    if len(faces1) == 0 or len(faces2) == 0:
        print("No faces detected in one or both images.")
        return

    # Crop the first detected face from both images
    x, y, w, h = faces1[0]
    face1 = gray1[y:y+h, x:x+w]

    x, y, w, h = faces2[0]
    face2 = gray2[y:y+h, x:x+w]

    # Resize both faces to the same size
    face1 = cv2.resize(face1, (100, 100))
    face2 = cv2.resize(face2, (100, 100))

    # Compare faces using histogram correlation
    hist1 = cv2.calcHist([face1], [0], None, [256], [0, 256])
    hist2 = cv2.calcHist([face2], [0], None, [256], [0, 256])

    # Normalize histograms
    cv2.normalize(hist1, hist1)
    cv2.normalize(hist2, hist2)

    # Compare histograms using correlation
    similarity = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)

    print(f"Face similarity score (higher is more similar): {similarity:.2f}")
    if similarity > 0.5:
        print("The faces are similar!")
    else:
        print("The faces are not similar.")

# Example usage
image1_path = "uploads/1729781545897.jpg"
image2_path = "uploads/1729705502870.jpg"
compare_faces(image1_path, image2_path)
