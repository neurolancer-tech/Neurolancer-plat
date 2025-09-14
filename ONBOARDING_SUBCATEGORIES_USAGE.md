# Onboarding Subcategories Usage Guide

> Complete implementation guide for subcategory selection in onboarding

## Overview
The onboarding system now supports subcategory selection, allowing users to specify their interests in specific AI subcategories during the onboarding process.

## Database Schema

### OnboardingResponse Model
```python
class OnboardingResponse(models.Model):
    # ... existing fields ...
    interested_subcategories = models.ManyToManyField(Subcategory, blank=True, related_name='interested_users')
```

## API Endpoints

### 1. Get Categories with Subcategories
```
GET /api/categories-with-subcategories/
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "AI Development & Engineering",
    "description": "Category for AI Development & Engineering",
    "icon": "🧠",
    "subcategories": [
      {
        "id": 1,
        "name": "Machine Learning Development (classification, regression, clustering)",
        "description": "",
        "created_at": "2024-12-01T10:00:00Z"
      },
      {
        "id": 2,
        "name": "Deep Learning Models (CNNs, RNNs, Transformers)",
        "description": "",
        "created_at": "2024-12-01T10:00:00Z"
      }
    ]
  }
]
```

### 2. Create/Update Onboarding Response
```
POST /api/onboarding/
PUT /api/onboarding/{id}/
```

**Request Body:**
```json
{
  "is_completed": true,
  "company_name": "Tech Corp",
  "industry": "Technology",
  "specialization": "[\"Machine Learning\", \"AI Development\"]",
  "interested_subcategory_ids": [1, 2, 5, 10]
}
```

**Response:**
```json
{
  "id": 1,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  },
  "is_completed": true,
  "company_name": "Tech Corp",
  "industry": "Technology",
  "interested_subcategories": [
    {
      "id": 1,
      "name": "Machine Learning Development (classification, regression, clustering)",
      "description": "",
      "created_at": "2024-12-01T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Deep Learning Models (CNNs, RNNs, Transformers)",
      "description": "",
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z"
}
```

## Frontend Implementation

### 1. Fetch Categories and Subcategories
```javascript
// Fetch all categories with their subcategories
const fetchCategoriesWithSubcategories = async () => {
  try {
    const response = await fetch('/api/categories-with-subcategories/');
    const categories = await response.json();
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};
```

### 2. Subcategory Selection Component
```jsx
import React, { useState, useEffect } from 'react';

const SubcategorySelector = ({ selectedSubcategories, onSelectionChange }) => {
  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState(selectedSubcategories || []);

  useEffect(() => {
    fetchCategoriesWithSubcategories().then(setCategories);
  }, []);

  const handleSubcategoryToggle = (subcategoryId) => {
    const newSelection = selectedIds.includes(subcategoryId)
      ? selectedIds.filter(id => id !== subcategoryId)
      : [...selectedIds, subcategoryId];
    
    setSelectedIds(newSelection);
    onSelectionChange(newSelection);
  };

  return (
    <div className="subcategory-selector">
      <h3>Select Your Areas of Interest</h3>
      {categories.map(category => (
        <div key={category.id} className="category-section">
          <h4 className="category-title">
            <span className="category-icon">{category.icon}</span>
            {category.name}
          </h4>
          <div className="subcategories-grid">
            {category.subcategories.map(subcategory => (
              <label key={subcategory.id} className="subcategory-item">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(subcategory.id)}
                  onChange={() => handleSubcategoryToggle(subcategory.id)}
                />
                <span className="subcategory-name">{subcategory.name}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 3. Onboarding Form Integration
```jsx
const OnboardingForm = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    interested_subcategory_ids: []
  });

  const handleSubcategoryChange = (subcategoryIds) => {
    setFormData(prev => ({
      ...prev,
      interested_subcategory_ids: subcategoryIds
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/onboarding/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Onboarding completed:', result);
        // Redirect or show success message
      }
    } catch (error) {
      console.error('Error submitting onboarding:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}
      
      <SubcategorySelector
        selectedSubcategories={formData.interested_subcategory_ids}
        onSelectionChange={handleSubcategoryChange}
      />
      
      <button type="submit">Complete Onboarding</button>
    </form>
  );
};
```

### 4. CSS Styling
```css
.subcategory-selector {
  margin: 20px 0;
}

.category-section {
  margin-bottom: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.category-title {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.category-icon {
  font-size: 24px;
  margin-right: 10px;
}

.subcategories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
}

.subcategory-item {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.subcategory-item:hover {
  background-color: #f9fafb;
  border-color: #6366f1;
}

.subcategory-item input[type="checkbox"] {
  margin-right: 10px;
  margin-top: 2px;
}

.subcategory-name {
  font-size: 14px;
  line-height: 1.4;
  color: #374151;
}

.subcategory-item input[type="checkbox"]:checked + .subcategory-name {
  color: #6366f1;
  font-weight: 500;
}
```

## Usage Examples

### 1. Get User's Interested Subcategories
```javascript
const getUserOnboarding = async (userId) => {
  const response = await fetch(`/api/onboarding/`);
  const onboarding = await response.json();
  return onboarding.interested_subcategories;
};
```

### 2. Filter Content by User Interests
```javascript
const getRecommendedGigs = async () => {
  const onboarding = await getUserOnboarding();
  const subcategoryIds = onboarding.interested_subcategories.map(sub => sub.id);
  
  const response = await fetch(`/api/gigs/?subcategories=${subcategoryIds.join(',')}`);
  return response.json();
};
```

### 3. Update User Interests
```javascript
const updateUserInterests = async (newSubcategoryIds) => {
  const response = await fetch('/api/onboarding/', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      interested_subcategory_ids: newSubcategoryIds
    })
  });
  
  return response.json();
};
```

## Data Structure

### Available Subcategories (60 total)

**AI Development & Engineering (10 subcategories)**
- Machine Learning Development (classification, regression, clustering)
- Deep Learning Models (CNNs, RNNs, Transformers)
- Large Language Models (fine-tuning, embeddings, RAG, custom GPTs)
- Prompt Engineering (chatbots, generative AI, system prompts)
- Natural Language Processing (text summarization, translation, sentiment analysis)
- Computer Vision (object detection, OCR, video analysis, AR/VR)
- Speech AI (speech-to-text, text-to-speech, speaker recognition)
- Reinforcement Learning (game AI, decision-making systems, robotics)
- MLOps & AI Infrastructure (deployment pipelines, CI/CD, Docker, Kubernetes)
- Edge AI & IoT AI (AI for mobile, embedded systems, smart devices)

**Data & Model Management (10 subcategories)**
- Data Annotation & Labeling (text, image, audio, video)
- Data Cleaning & Preprocessing (feature engineering, outlier handling)
- Synthetic Data Generation (simulation, GANs, data augmentation)
- Data Visualization & Dashboards (BI tools, custom dashboards)
- Model Training (supervised, unsupervised, semi-supervised)
- Model Optimization (pruning, quantization, distillation)
- Model Monitoring & Evaluation (performance metrics, error analysis)
- Data Engineering (ETL pipelines, big data frameworks like Spark)
- MLOps for Data (automated retraining, monitoring pipelines)
- Cloud AI Setup (AWS Sagemaker, Google Vertex AI, Azure ML)

**AI Ethics, Law & Governance (10 subcategories)**
- Bias & Fairness Audits (dataset bias detection, model bias testing)
- Privacy-Preserving AI (federated learning, differential privacy)
- AI Compliance (GDPR, HIPAA, EU AI Act, CCPA audits)
- Risk Assessment & Safety (AI misuse, red teaming, risk frameworks)
- AI Governance Frameworks (internal policies, accountability systems)
- Explainable AI (interpretable models, SHAP, LIME, transparency reports)
- AI Policy & Strategy Advisory (corporate AI policies, national strategies)
- Ethical AI Consulting (human oversight, cultural sensitivity in AI)
- Algorithmic Accountability (impact assessments, transparency standards)
- Responsible Data Use (data ownership, consent management)

**AI Integration & Support (10 subcategories)**
- Chatbot & Virtual Assistants (customer support, voice assistants)
- Workflow Automation (CRM, ERP, marketing automation with AI)
- AI API Integration (OpenAI, Anthropic, Hugging Face, custom APIs)
- AI in Business Intelligence (AI dashboards, predictive analytics)
- AI Product Management (scoping features, building roadmaps)
- AI Training & Workshops (staff training, AI bootcamps, corporate enablement)
- Customer Support AI (ticket triaging, knowledge base bots)
- AI Consulting for SMBs (strategy, adoption, feasibility studies)
- Cloud AI Deployment (AWS, Azure, GCP AI solutions)
- AI Model Maintenance (bug fixing, retraining, monitoring post-deployment)

**Creative & Industry-Specific AI Roles (10 subcategories)**
- AI Content Writing (blogs, ad copy, SEO with AI assistance)
- AI Art & Design (digital art, logo design, concept art, 3D renders)
- AI in Music & Audio (music composition, mixing, podcast editing)
- AI in Video (video generation, VFX, AI-powered editing)
- AI in Gaming (NPCs, procedural content generation, dynamic environments)
- AI in Healthcare (diagnostic support, medical data analysis, patient triage AI)
- AI in Finance (fraud detection, algorithmic trading, risk models)
- AI in Education (personalized learning platforms, tutoring bots)
- AI in Marketing (ad targeting, customer segmentation, campaign optimization)
- AI in Legal & Research (contract analysis, AI legal research assistants)

**AI Operations in New Markets (10 subcategories)**
- Digital Twins & Simulation (smart factories, cities, supply chains)
- AI for Agriculture (crop monitoring, pest detection, soil health analysis)
- AI for Climate & Environment (energy optimization, emissions tracking)
- AI in Logistics (demand forecasting, route optimization, fleet AI)
- AI Companions & Agents (virtual friends, therapy bots, personal agents)
- AI in Retail (recommendation engines, dynamic pricing, inventory prediction)
- AI for Government & Policy (public sector AI use, e-governance)
- AI in Security & Surveillance (threat detection, anomaly monitoring)
- AI in Autonomy & Robotics (self-driving systems, drone oversight, robotics vision)
- AI for Developing Economies (local language AI, low-resource models, community solutions)

## Best Practices

1. **Limit Selection**: Consider limiting users to 5-10 subcategories to avoid overwhelming choices
2. **Progressive Disclosure**: Show categories first, then expand to show subcategories
3. **Search Functionality**: Add search to help users find specific subcategories
4. **Validation**: Ensure at least one subcategory is selected for freelancers
5. **Persistence**: Save selections as users navigate between steps
6. **Recommendations**: Use selections to personalize job/gig recommendations