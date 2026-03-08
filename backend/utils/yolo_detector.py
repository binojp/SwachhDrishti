import sys
import json
import os

# Suppress ultralytics logging
os.environ['YOLO_VERBOSE'] = 'False'

try:
    from ultralytics import YOLO
except ImportError:
    print(json.dumps({"error": "ultralytics not installed"}))
    sys.exit(1)

def run_detection(image_path, model_path):
    if not os.path.exists(model_path):
        return {"error": f"Model file not found at {model_path}"}
    
    if not os.path.exists(image_path):
        return {"error": f"Image file not found at {image_path}"}

    try:
        model = YOLO(model_path)
        # Run inference
        results = model(image_path, verbose=False)
        
        detections = []
        for r in results:
            for box in r.boxes:
                detections.append({
                    "class": model.names[int(box.cls)],
                    "confidence": round(float(box.conf), 3),
                    "bbox": [round(x, 2) for x in box.xyxy[0].tolist()]
                })
        
        return {
            "success": True,
            "detections": detections,
            "count": len(detections)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python yolo_detector.py <image_path> <model_path>"}))
        sys.exit(1)
    
    img_path = sys.argv[1]
    mdl_path = sys.argv[2]
    
    result = run_detection(img_path, mdl_path)
    print(json.dumps(result))
