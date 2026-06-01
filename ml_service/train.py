import os
import ssl
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, random_split

# Fix SSL certificate verification issue on macOS
ssl._create_default_https_context = ssl._create_unverified_context

# Removed old CLASS_MAPPING and MappedImageFolder

def train_model(data_dir, num_epochs=10, batch_size=32):
    # Data augmentation and normalization
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    print(f"Loading dataset from {data_dir}...")
    full_dataset = datasets.ImageFolder(root=data_dir, transform=transform)
    
    # Force the class indices to match the original model's TARGET_CLASSES (0: wet, 1: dry, 2: hazardous)
    # so we don't break the frontend/backend integration
    target_classes = ["wet", "dry", "hazardous"]
    target_class_to_idx = {cls: idx for idx, cls in enumerate(target_classes)}
    
    mapped_samples = []
    for path, old_idx in full_dataset.samples:
        old_class_name = full_dataset.classes[old_idx].lower()
        new_idx = target_class_to_idx[old_class_name]
        mapped_samples.append((path, new_idx))
        
    full_dataset.samples = mapped_samples
    full_dataset.targets = [s[1] for s in mapped_samples]
    full_dataset.classes = target_classes
    full_dataset.class_to_idx = target_class_to_idx
    print(f"Total images found: {len(full_dataset)}")
    
    # Split into train and validation
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2)

    device = torch.device("cuda:0" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu"))
    print(f"Training on device: {device}")

    # Use a pre-trained MobileNetV2 for fast and efficient training
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    
    # Freeze early layers
    for param in model.parameters():
        param.requires_grad = False
        
    # Replace the classifier
    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_ftrs, 3) # 3 classes: wet, dry, hazardous
    
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=0.001)

    print("Starting training...")
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        running_corrects = 0
        
        for inputs, labels in train_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)
            
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

        epoch_loss = running_loss / train_size
        epoch_acc = running_corrects.float() / train_size
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_corrects = 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(device)
                labels = labels.to(device)
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data)
                
        val_epoch_loss = val_loss / val_size
        val_epoch_acc = val_corrects.float() / val_size
        
        print(f'Epoch {epoch+1}/{num_epochs} - '
              f'Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f} | '
              f'Val Loss: {val_epoch_loss:.4f} Acc: {val_epoch_acc:.4f}')

    # Save the model
    os.makedirs("models", exist_ok=True)
    torch.save(model.state_dict(), 'models/waste_classifier.pth')
    print("Model saved to models/waste_classifier.pth")

if __name__ == '__main__':
    # Assuming datasets are extracted to ../data
    data_directory = "/Users/khagembasapam11/Documents/new dataset"
    if not os.path.exists(data_directory) or len(os.listdir(data_directory)) == 0:
        print(f"Error: Dataset directory {data_directory} is empty or not found.")
    else:
        train_model(data_directory, num_epochs=20)
