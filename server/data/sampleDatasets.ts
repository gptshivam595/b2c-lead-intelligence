/**
 * AI Lead Intelligence — Realistic 30-Lead Benchmark Dataset
 * Authentic messy B2C lead dataset representing real-world inbound inquiries for Skillcase.
 * Contains typos, duplicates, non-relevant leads, contradictions, formula injections, and high-intent leads.
 */

export interface RawLeadInput {
  'Full Name'?: string;
  'Candidate'?: string;
  'Contact Number'?: string;
  'Mobile'?: string;
  'Email Address'?: string;
  'Email'?: string;
  'City'?: string;
  'Location'?: string;
  'Inquiry Notes'?: string;
  'Query'?: string;
  'Lead Source'?: string;
  'Experience'?: string;
  'Current Role'?: string;
  [key: string]: any;
}

export const SKILLCASE_30_LEADS_DATASET: RawLeadInput[] = [
  {
    'Full Name': 'Rohan Sharma',
    'Contact Number': '+91 98765 43210',
    'Email Address': 'rohan.sharma.tech@gmail.com',
    'City': 'Bengaluru',
    'Inquiry Notes': 'Working as software engineer at mid-size services company for 3 years. Want to transition to Applied AI and learn hands-on LangChain and RAG. Can only attend weekend batches.',
    'Lead Source': 'LinkedIn Ads',
    'Experience': '3 Years',
    'Current Role': 'Software Engineer',
  },
  {
    'Full Name': 'Priya Patel',
    'Contact Number': '9823456789',
    'Email Address': 'priya.patel.qa@yahoo.com',
    'City': 'Pune',
    'Inquiry Notes': 'Currently manual QA tester with 4 years experience. Worried about AI taking my job. Need mentorship to learn Python and Full-Stack AI from scratch. What is the fee structure and EMI options?',
    'Lead Source': 'Google Search',
    'Experience': '4 Years',
    'Current Role': 'QA Tester',
  },
  {
    'Full Name': 'Ananya Gupta',
    'Contact Number': '+91 99887 76655',
    'Email Address': 'ananya.gupta2025@gmail.com',
    'City': 'Delhi NCR',
    'Inquiry Notes': 'Final year B.Tech Computer Science student graduating this summer. Have built basic PyTorch models. Are freshers eligible for the placement referral network and mentorship?',
    'Lead Source': 'Campus Webinar',
    'Experience': 'Fresher',
    'Current Role': 'Student',
  },
  {
    'Full Name': 'Vikram Malhotra',
    'Contact Number': '+91 91234 56780',
    'Email Address': 'vikram.malhotra@outlook.com',
    'City': 'Bengaluru',
    'Inquiry Notes': 'Senior IT Analyst with 8 years in tech. Looking to build real production AI applications and pivot to Tech Lead. Ready to join the next immediate cohort starting this month.',
    'Lead Source': 'Referral',
    'Experience': '8 Years',
    'Current Role': 'IT Analyst',
  },
  {
    // DUPLICATE OF LEAD 1 (Same email & phone, slight name alias)
    'Full Name': 'Rohan S.',
    'Contact Number': '+91 98765 43210',
    'Email Address': 'rohan.sharma.tech@gmail.com',
    'City': 'Bengaluru',
    'Inquiry Notes': 'Checking on syllabus brochure and discount for upfront payment.',
    'Lead Source': 'Direct Website Form',
    'Experience': '3 Years',
    'Current Role': 'Software Engineer',
  },
  {
    // HARD DISQUALIFIER 1: B2B HR Vendor
    'Full Name': 'Rajesh Verma',
    'Contact Number': '+91 98450 11223',
    'Email Address': 'rajesh@talentsolutions-vendor.com',
    'City': 'Mumbai',
    'Inquiry Notes': 'We provide bulk hiring recruitment software and want to sell our SaaS portal to Skillcase HR management team. Please connect with your procurement head.',
    'Lead Source': 'Cold Inbound Form',
    'Experience': '10 Years',
    'Current Role': 'Vendor Sales Representative',
  },
  {
    // HARD DISQUALIFIER 2: Unrelated Field (Clinical Medicine)
    'Full Name': 'Dr. Neha Joshi',
    'Contact Number': '98700 99887',
    'Email Address': 'dr.neha.joshi@apollohealth.org',
    'City': 'Hyderabad',
    'Inquiry Notes': 'I am a medical doctor preparing for USMLE and clinical medicine residency. Does your institute offer surgical training or medical internship rotations?',
    'Lead Source': 'Organic Search',
    'Experience': '2 Years',
    'Current Role': 'Medical Resident',
  },
  {
    // TYPO EMAIL & UNFORMATTED PHONE
    'Full Name': 'Amit Kumar',
    'Contact Number': '9811223344',
    'Email Address': 'amit.k.dev@gmial.com', // Typo domain gmial.com
    'City': 'Noida',
    'Inquiry Notes': 'Backend developer with Node.js and Postgres. Want to understand how LLMs are integrated with backend APIs. Please share the detailed module breakdown.',
    'Lead Source': 'Facebook Ad',
    'Experience': '2 Years',
    'Current Role': 'Backend Developer',
  },
  {
    // HARD DISQUALIFIER 3: Explicit Do-Not-Contact
    'Full Name': 'Sneha Reddy',
    'Contact Number': '+91 97654 32109',
    'Email Address': 'sneha.r@gmail.com',
    'City': 'Chennai',
    'Inquiry Notes': 'STOP CALLING ME. I did not submit this form. Remove my phone number and email from your database immediately.',
    'Lead Source': 'Unknown',
    'Experience': 'N/A',
    'Current Role': 'Unknown',
  },
  {
    // CONTRADICTION: Spreadsheet attribute says "Fresher", but Inquiry says 5 years Java at Infosys
    'Full Name': 'Karthik Iyer',
    'Contact Number': '+91 99112 23344',
    'Email Address': 'karthik.iyer@gmail.com',
    'City': 'Bengaluru',
    'Inquiry Notes': 'I have 5 years of solid Java and Spring Boot experience at Infosys. Looking to switch to AI engineering to increase my CTC. Need help preparing for system design interviews.',
    'Lead Source': 'Alumni Referral',
    'Experience': 'Fresher', // Cross-field contradiction!
    'Current Role': 'Senior Java Developer',
  },
  {
    // UNCERTAIN / LOW CONFIDENCE / MISSING PHONE
    'Full Name': 'Pooja Nair',
    'Contact Number': '',
    'Email Address': 'pooja.nair.99@gmail.com',
    'City': 'Kochi',
    'Inquiry Notes': 'Send details.',
    'Lead Source': 'Instagram Link',
    'Experience': '',
    'Current Role': '',
  },
  {
    // POSSIBLE FUZZY DUPLICATE of Lead 4 (Vikram Malhotra in Bengaluru)
    'Full Name': 'Vikram M.',
    'Contact Number': '+91 91234 56781', // 1 digit off
    'Email Address': 'vikram.m.tech@gmail.com',
    'City': 'Bengaluru',
    'Inquiry Notes': 'Senior analyst in IT, 8 yrs experience. Interested in AI cohort starting this month.',
    'Lead Source': 'LinkedIn Inbound',
    'Experience': '8 Years',
    'Current Role': 'Senior Analyst',
  },
  {
    // OBJECTION: University Degree vs Industry Accelerator
    'Full Name': 'Meera Sundaram',
    'Contact Number': '98220 33445',
    'Email Address': 'meera.sundaram@gmail.com',
    'City': 'Chennai',
    'Inquiry Notes': 'Does Skillcase provide an official UGC or AICTE accredited Master of Technology degree? My parents will only support my education if I get a university degree certificate.',
    'Lead Source': 'Google Ads',
    'Experience': '1 Year',
    'Current Role': 'Associate Software Engineer',
  },
  {
    // FORMULA INJECTION ATTEMPT
    'Full Name': '=cmd|\' /C calc\'!A0',
    'Contact Number': '9833445566',
    'Email Address': 'arjun.r@sec-audit.org',
    'City': 'Mumbai',
    'Inquiry Notes': '=SUM(1+99)+@HYPERLINK("http://evil.com","Click Here")',
    'Lead Source': 'Security Test',
    'Experience': '5 Years',
    'Current Role': 'Penetration Tester',
  },
  {
    // HIGH COMMERCIAL PRIORITY (Urgent, Budget Ready)
    'Full Name': 'Divya Prakash',
    'Contact Number': '+91 98990 12345',
    'Email Address': 'divya.prakash.ai@gmail.com',
    'City': 'Gurugram',
    'Inquiry Notes': 'I was laid off last week from my edtech company. I have 3 years React/Node experience. I have my budget ready and want to enroll in the batch starting this Saturday. Can someone call me today?',
    'Lead Source': 'Urgent Search',
    'Experience': '3 Years',
    'Current Role': 'Full-Stack Developer',
  },
  {
    // SUSPICIOUS DUMMY PHONE NUMBER (9999999999)
    'Full Name': 'Sandeep Rao',
    'Contact Number': '9999999999',
    'Email Address': 'sandeep.rao@outlook.com',
    'City': 'Hyderabad',
    'Inquiry Notes': 'What are your average CTC placement figures for past cohorts? Do you offer live mock interviews?',
    'Lead Source': 'Blog Post',
    'Experience': '2 Years',
    'Current Role': 'Data Analyst',
  },
  {
    'Full Name': 'Tanvi Shah',
    'Contact Number': '+91 98201 23456',
    'Email Address': 'tanvi.shah.pm@gmail.com',
    'City': 'Mumbai',
    'Inquiry Notes': 'Technical Product Manager with 5 years experience. Want to learn AI architecture, prompt evaluation, and LLM orchestration to lead our internal AI product roadmap.',
    'Lead Source': 'Product Hunt',
    'Experience': '5 Years',
    'Current Role': 'Technical Product Manager',
  },
  {
    // MISSING PHONE & LOCATION
    'Full Name': 'Harsh Vardhan',
    'Contact Number': '',
    'Email Address': 'harsh.v@gmail.com',
    'City': '',
    'Inquiry Notes': 'Interested in scholarship. Is there any financial assistance for tier-3 college students?',
    'Lead Source': 'YouTube Video',
    'Experience': 'Student',
    'Current Role': 'Student',
  },
  {
    // HARD DISQUALIFIER 4: Spam / Crypto Solicitation
    'Full Name': 'Monica Geller',
    'Contact Number': '1234567890',
    'Email Address': 'crypto-fast-roi@spam-network.biz',
    'City': 'International',
    'Inquiry Notes': 'Guaranteed 500% returns in 24 hours on crypto staking. Click here: http://bit.ly/crypto-scam-bot to start trading.',
    'Lead Source': 'Bot Submission',
    'Experience': 'N/A',
    'Current Role': 'Spammer',
  },
  {
    'Full Name': 'Deepak Chawla',
    'Contact Number': '+91 97112 34567',
    'Email Address': 'deepak.chawla@devops.in',
    'City': 'Noida',
    'Inquiry Notes': 'DevOps engineer managing Kubernetes clusters. Looking to specialize in MLOps and LLM deployment pipelines with vLLM and Triton server.',
    'Lead Source': 'LinkedIn',
    'Experience': '4 Years',
    'Current Role': 'DevOps Engineer',
  },
  {
    // NON-CAPABILITY TEST: 100% Unconditional Job Guarantee
    'Full Name': 'Shweta Agarwal',
    'Contact Number': '+91 98401 23456',
    'Email Address': 'shweta.a@gmail.com',
    'City': 'Kolkata',
    'Inquiry Notes': 'Will you give me an unconditional written 100% money-back job guarantee of at least 15 LPA salary even if I fail the mock interviews?',
    'Lead Source': 'Google Ads',
    'Experience': '1 Year',
    'Current Role': 'Trainee Engineer',
  },
  {
    'Full Name': 'Aditya Sen',
    'Contact Number': '+91 98300 45678',
    'Email Address': 'aditya.sen.dev@gmail.com',
    'City': 'Kolkata',
    'Inquiry Notes': 'Frontend specialist (React, Next.js). Want to learn Python, vector databases, and how to build generative AI interfaces. Interested in weekend batch.',
    'Lead Source': 'Twitter / X',
    'Experience': '2.5 Years',
    'Current Role': 'Frontend Developer',
  },
  {
    // EXACT DUPLICATE PHONE OF LEAD 11 (Pooja Nair)
    'Full Name': 'Swati Kulkarni',
    'Contact Number': '+91 99112 23344', // Same as Karthik Iyer's phone!
    'Email Address': 'swati.k@gmail.com',
    'City': 'Bengaluru',
    'Inquiry Notes': 'Follow-up on course curriculum and syllabus.',
    'Lead Source': 'Inbound Form',
    'Experience': '2 Years',
    'Current Role': 'Software Engineer',
  },
  {
    // NON-CAPABILITY TEST: Offline Classroom In Nagpur
    'Full Name': 'Nitin Gadkari',
    'Contact Number': '+91 94221 00112',
    'Email Address': 'nitin.g.tech@gmail.com',
    'City': 'Nagpur',
    'Inquiry Notes': 'I want to attend physical offline classroom lectures in Nagpur. I do not want online Zoom classes. Where is your physical branch in Nagpur?',
    'Lead Source': 'Newspaper Ad',
    'Experience': '3 Years',
    'Current Role': 'System Admin',
  },
  {
    // UNQUALIFIED / AMBIGUOUS INTENT
    'Full Name': 'Bhavna Bhatt',
    'Contact Number': '98711 22334',
    'Email Address': 'bhavna.bhatt@gmail.com',
    'City': 'Ahmedabad',
    'Inquiry Notes': 'I studied history in college and have never touched a computer program. Can I become an AI architect in 2 weeks and get a 20 LPA job?',
    'Lead Source': 'Instagram Ad',
    'Experience': '0',
    'Current Role': 'Non-technical',
  },
  {
    'Full Name': 'Gaurav Khanna',
    'Contact Number': '+91 98101 98765',
    'Email Address': 'gaurav.khanna.freelance@gmail.com',
    'City': 'Chandigarh',
    'Inquiry Notes': 'Freelance web developer looking to build custom AI chatbots and agentic workflows for international Upwork clients. Need portfolio capstone projects.',
    'Lead Source': 'Upwork Community',
    'Experience': '4 Years',
    'Current Role': 'Freelancer',
  },
  {
    // HIGH INTENT: Employer Corporate Reimbursement
    'Full Name': 'Ritu Singhania',
    'Contact Number': '+91 98212 34567',
    'Email Address': 'ritu.singhania@deloitte.com',
    'City': 'Mumbai',
    'Inquiry Notes': 'My company (Deloitte) has approved $1,500 annual learning reimbursement. Do you provide official GST invoice and certificate of completion so I can submit it for reimbursement?',
    'Lead Source': 'Corporate Portal',
    'Experience': '5 Years',
    'Current Role': 'Consultant',
  },
  {
    // MESSY WHITESPACE & LOWERCASE
    'Full Name': 'krunal   pandya  ',
    'Contact Number': '98250 12345',
    'Email Address': 'krunal.pandya@gmail.com',
    'City': 'Vadodara',
    'Inquiry Notes': 'Looking for AI engineering batch. Please share syllabus.',
    'Lead Source': 'Website Form',
    'Experience': '2 Years',
    'Current Role': 'Engineer',
  },
  {
    'Full Name': 'Zoya Akhtar',
    'Contact Number': '+91 98455 66778',
    'Email Address': 'zoya.akhtar.dev@gmail.com',
    'City': 'Bengaluru',
    'Inquiry Notes': 'Currently working in European shift (2 PM - 11 PM IST). Are sessions recorded or available on Sunday mornings? Very interested in the LangChain and vector DB module.',
    'Lead Source': 'LinkedIn',
    'Experience': '3 Years',
    'Current Role': 'Backend Developer',
  },
  {
    // HARD DISQUALIFIER 5: Complete Free Tutoring / Non-viable
    'Full Name': 'Manisha Koirala',
    'Contact Number': '98100 00001',
    'Email Address': 'manisha.k@gmail.com',
    'City': 'Patna',
    'Inquiry Notes': 'Please teach me everything for free. I cannot pay anything and I do not have a laptop. Give me a free laptop and free stipend to learn.',
    'Lead Source': 'Direct Form',
    'Experience': '0',
    'Current Role': 'Unemployed',
  },
];
