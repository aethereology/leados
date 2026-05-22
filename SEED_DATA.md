# LeadOS Seed Data

Use this file to create realistic demo data.

Seed scripts should be safe to rerun where practical.

## Demo Agency

Name:

Spark Growth Systems

Slug:

spark-growth-systems

## Demo Tenant

Name:

BrightSkin Med Spa

Slug:

brightskin-med-spa

Status:

active

## Default Pipeline

Name:

Sales Pipeline

Stages:

1. New Lead
2. Contacted
3. Booked
4. Won
5. Lost

## Demo Contacts

### Contact 1

First name: Sarah
Last name: Miller
Email: sarah@example.com
Phone: +15551112222
Source: Consultation Request Form
Tags: consultation-lead, botox
Notes: Interested in Botox consultation.
Consent SMS: true
Consent Email: true

### Contact 2

First name: Jessica
Last name: Lee
Email: jessica@example.com
Phone: +15552223333
Source: Consultation Request Form
Tags: consultation-lead, laser-facial
Notes: Interested in laser facial.
Consent SMS: true
Consent Email: true

### Contact 3

First name: Amanda
Last name: Torres
Email: amanda@example.com
Phone: +15553334444
Source: Website Form
Tags: consultation-lead
Notes: Wants a general consultation.
Consent SMS: true
Consent Email: true

## Demo Opportunities

### Opportunity 1

Title: Sarah Miller Botox Consultation
Contact: Sarah Miller
Value: 500
Stage: New Lead
Status: open
Source: Consultation Request Form

### Opportunity 2

Title: Jessica Lee Laser Facial
Contact: Jessica Lee
Value: 350
Stage: Contacted
Status: open
Source: Consultation Request Form

### Opportunity 3

Title: Amanda Torres Consultation
Contact: Amanda Torres
Value: 250
Stage: Booked
Status: open
Source: Website Form

## Demo Form

Name:

Consultation Request Form

Slug:

consultation-request

Default fields:

- firstName
- lastName
- email
- phone
- interestedService
- preferredTime
- message

## Demo Workflow Definition

Name:

New Consultation Lead Follow-Up

Trigger type:

form_submitted

Actions JSON:

```json
[
  {
    "type": "send_sms",
    "body": "Hey {{firstName}}, thanks for requesting a consultation. Want to book a time this week?"
  },
  {
    "type": "send_email",
    "subject": "Thanks for your consultation request",
    "body": "We received your request and will follow up shortly."
  },
  {
    "type": "add_tag",
    "tag": "consultation-lead"
  }
]
```

## System Blueprints

### 1. Med Spa Lead Follow-Up Blueprint

Niche:

Med Spa

Pipeline stages:

1. New Consultation Lead
2. Contacted
3. Consultation Booked
4. Treatment Sold
5. Lost

Form fields:

- firstName
- lastName
- phone
- email
- interestedService
- preferredTime
- message

Workflow trigger:

form_submitted

Actions JSON:

```json
[
  {
    "type": "send_sms",
    "body": "Hey {{firstName}}, thanks for requesting a consultation. Want to book a time this week?"
  },
  {
    "type": "send_email",
    "subject": "Thanks for your consultation request",
    "body": "We received your request and will follow up shortly."
  },
  {
    "type": "add_tag",
    "tag": "consultation-lead"
  }
]
```

### 2. Roofer Estimate Request Blueprint

Niche:

Roofing

Pipeline stages:

1. New Estimate Request
2. Contacted
3. Inspection Scheduled
4. Estimate Sent
5. Won
6. Lost

Form fields:

- firstName
- lastName
- phone
- email
- propertyAddress
- roofIssue
- preferredTime
- message

Workflow trigger:

form_submitted

Actions JSON:

```json
[
  {
    "type": "send_sms",
    "body": "Hey {{firstName}}, thanks for requesting a roofing estimate. What is the best time to schedule an inspection?"
  },
  {
    "type": "send_email",
    "subject": "We received your roofing estimate request",
    "body": "Thanks for reaching out. Our team will follow up to schedule your inspection."
  },
  {
    "type": "add_tag",
    "tag": "estimate-request"
  }
]
```

### 3. Dentist Appointment Request Blueprint

Niche:

Dentist

Pipeline stages:

1. New Appointment Request
2. Contacted
3. Appointment Booked
4. Treatment Accepted
5. Lost

Form fields:

- firstName
- lastName
- phone
- email
- appointmentReason
- preferredTime
- message

Workflow trigger:

form_submitted

Actions JSON:

```json
[
  {
    "type": "send_sms",
    "body": "Hey {{firstName}}, thanks for requesting a dental appointment. What day works best for you?"
  },
  {
    "type": "send_email",
    "subject": "We received your appointment request",
    "body": "Thanks for contacting us. We will follow up shortly to confirm a time."
  },
  {
    "type": "add_tag",
    "tag": "appointment-request"
  }
]
```
