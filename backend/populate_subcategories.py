#!/usr/bin/env python
"""
Populate subcategories for AI service categories
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.models import Category, Subcategory

def populate_subcategories():
    """Populate subcategories from the landing page data"""
    
    # AI Development & Engineering subcategories
    ai_dev_subcategories = [
        'Machine Learning Development (classification, regression, clustering)',
        'Deep Learning Models (CNNs, RNNs, Transformers)',
        'Large Language Models (fine-tuning, embeddings, RAG, custom GPTs)',
        'Prompt Engineering (chatbots, generative AI, system prompts)',
        'Natural Language Processing (text summarization, translation, sentiment analysis)',
        'Computer Vision (object detection, OCR, video analysis, AR/VR)',
        'Speech AI (speech-to-text, text-to-speech, speaker recognition)',
        'Reinforcement Learning (game AI, decision-making systems, robotics)',
        'MLOps & AI Infrastructure (deployment pipelines, CI/CD, Docker, Kubernetes)',
        'Edge AI & IoT AI (AI for mobile, embedded systems, smart devices)'
    ]
    
    # Data & Model Management subcategories
    data_model_subcategories = [
        'Data Annotation & Labeling (text, image, audio, video)',
        'Data Cleaning & Preprocessing (feature engineering, outlier handling)',
        'Synthetic Data Generation (simulation, GANs, data augmentation)',
        'Data Visualization & Dashboards (BI tools, custom dashboards)',
        'Model Training (supervised, unsupervised, semi-supervised)',
        'Model Optimization (pruning, quantization, distillation)',
        'Model Monitoring & Evaluation (performance metrics, error analysis)',
        'Data Engineering (ETL pipelines, big data frameworks like Spark)',
        'MLOps for Data (automated retraining, monitoring pipelines)',
        'Cloud AI Setup (AWS Sagemaker, Google Vertex AI, Azure ML)'
    ]
    
    # AI Ethics, Law & Governance subcategories
    ai_ethics_subcategories = [
        'Bias & Fairness Audits (dataset bias detection, model bias testing)',
        'Privacy-Preserving AI (federated learning, differential privacy)',
        'AI Compliance (GDPR, HIPAA, EU AI Act, CCPA audits)',
        'Risk Assessment & Safety (AI misuse, red teaming, risk frameworks)',
        'AI Governance Frameworks (internal policies, accountability systems)',
        'Explainable AI (interpretable models, SHAP, LIME, transparency reports)',
        'AI Policy & Strategy Advisory (corporate AI policies, national strategies)',
        'Ethical AI Consulting (human oversight, cultural sensitivity in AI)',
        'Algorithmic Accountability (impact assessments, transparency standards)',
        'Responsible Data Use (data ownership, consent management)'
    ]
    
    # AI Integration & Support subcategories
    ai_integration_subcategories = [
        'Chatbot & Virtual Assistants (customer support, voice assistants)',
        'Workflow Automation (CRM, ERP, marketing automation with AI)',
        'AI API Integration (OpenAI, Anthropic, Hugging Face, custom APIs)',
        'AI in Business Intelligence (AI dashboards, predictive analytics)',
        'AI Product Management (scoping features, building roadmaps)',
        'AI Training & Workshops (staff training, AI bootcamps, corporate enablement)',
        'Customer Support AI (ticket triaging, knowledge base bots)',
        'AI Consulting for SMBs (strategy, adoption, feasibility studies)',
        'Cloud AI Deployment (AWS, Azure, GCP AI solutions)',
        'AI Model Maintenance (bug fixing, retraining, monitoring post-deployment)'
    ]
    
    # Creative & Industry-Specific AI Roles subcategories
    creative_ai_subcategories = [
        'AI Content Writing (blogs, ad copy, SEO with AI assistance)',
        'AI Art & Design (digital art, logo design, concept art, 3D renders)',
        'AI in Music & Audio (music composition, mixing, podcast editing)',
        'AI in Video (video generation, VFX, AI-powered editing)',
        'AI in Gaming (NPCs, procedural content generation, dynamic environments)',
        'AI in Healthcare (diagnostic support, medical data analysis, patient triage AI)',
        'AI in Finance (fraud detection, algorithmic trading, risk models)',
        'AI in Education (personalized learning platforms, tutoring bots)',
        'AI in Marketing (ad targeting, customer segmentation, campaign optimization)',
        'AI in Legal & Research (contract analysis, AI legal research assistants)'
    ]
    
    # AI Operations in New Markets subcategories
    ai_operations_subcategories = [
        'Digital Twins & Simulation (smart factories, cities, supply chains)',
        'AI for Agriculture (crop monitoring, pest detection, soil health analysis)',
        'AI for Climate & Environment (energy optimization, emissions tracking)',
        'AI in Logistics (demand forecasting, route optimization, fleet AI)',
        'AI Companions & Agents (virtual friends, therapy bots, personal agents)',
        'AI in Retail (recommendation engines, dynamic pricing, inventory prediction)',
        'AI for Government & Policy (public sector AI use, e-governance)',
        'AI in Security & Surveillance (threat detection, anomaly monitoring)',
        'AI in Autonomy & Robotics (self-driving systems, drone oversight, robotics vision)',
        'AI for Developing Economies (local language AI, low-resource models, community solutions)'
    ]
    
    # Category mapping
    categories_data = {
        'AI Development & Engineering': ai_dev_subcategories,
        'Data & Model Management': data_model_subcategories,
        'AI Ethics, Law & Governance': ai_ethics_subcategories,
        'AI Integration & Support': ai_integration_subcategories,
        'Creative & Industry-Specific AI Roles': creative_ai_subcategories,
        'AI Operations in New Markets': ai_operations_subcategories,
    }
    
    print("Starting subcategory population...")
    
    for category_name, subcategories in categories_data.items():
        try:
            # Get or create category
            category, created = Category.objects.get_or_create(
                name=category_name,
                defaults={
                    'description': f'Services related to {category_name.lower()}',
                    'icon': get_category_icon(category_name)
                }
            )
            
            if created:
                print(f"✓ Created category: {category_name}")
            else:
                print(f"✓ Found existing category: {category_name}")
            
            # Add subcategories
            for subcategory_name in subcategories:
                subcategory, sub_created = Subcategory.objects.get_or_create(
                    category=category,
                    name=subcategory_name,
                    defaults={
                        'description': f'Specialized services in {subcategory_name.lower()}',
                        'is_active': True
                    }
                )
                
                if sub_created:
                    print(f"  ✓ Added subcategory: {subcategory_name[:50]}...")
                else:
                    print(f"  - Existing subcategory: {subcategory_name[:50]}...")
        
        except Exception as e:
            print(f"✗ Error processing {category_name}: {str(e)}")
    
    print("\nSubcategory population completed!")
    print(f"Total categories: {Category.objects.count()}")
    print(f"Total subcategories: {Subcategory.objects.count()}")

def get_category_icon(category_name):
    """Get appropriate icon for each category"""
    icons = {
        'AI Development & Engineering': '🧠',
        'Data & Model Management': '🗃️',
        'AI Ethics, Law & Governance': '⚖️',
        'AI Integration & Support': '🔌',
        'Creative & Industry-Specific AI Roles': '🎨',
        'AI Operations in New Markets': '🌍',
    }
    return icons.get(category_name, '🤖')

if __name__ == '__main__':
    populate_subcategories()