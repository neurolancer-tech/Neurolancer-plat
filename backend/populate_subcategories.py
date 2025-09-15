#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.models import Category, Subcategory

def populate_subcategories():
    # Define categories and their subcategories
    categories_data = {
        'AI Development & Engineering': [
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
        ],
        'Data & Model Management': [
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
        ],
        'AI Ethics, Law & Governance': [
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
        ],
        'AI Integration & Support': [
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
        ],
        'Creative & Industry-Specific AI Roles': [
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
        ],
        'AI Operations in New Markets': [
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
    }

    print("Populating subcategories...")
    
    for category_name, subcategories in categories_data.items():
        # Get or create category
        category, created = Category.objects.get_or_create(
            name=category_name,
            defaults={'description': f'Category for {category_name}'}
        )
        
        if created:
            print(f"Created category: {category_name}")
        else:
            print(f"Found existing category: {category_name}")
        
        # Add subcategories
        for subcategory_name in subcategories:
            subcategory, created = Subcategory.objects.get_or_create(
                category=category,
                name=subcategory_name
            )
            
            if created:
                print(f"  + Added subcategory: {subcategory_name}")
            else:
                print(f"  - Subcategory already exists: {subcategory_name}")
    
    print(f"\nCompleted! Total categories: {Category.objects.count()}")
    print(f"Total subcategories: {Subcategory.objects.count()}")

if __name__ == '__main__':
    populate_subcategories()