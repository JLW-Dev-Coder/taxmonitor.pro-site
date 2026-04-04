// Sample directory profiles loaded from directory/sample-{slug}/data.json.
// Used as seed/fallback data when the VLP API returns no results.
// Read-only — the source data.json files are not modified.

/* ── Types ── */

export interface DirectoryProfessional {
  professional_id: string
  name: string
  title: string
  specialty: string[]
  location: string
  avatar_url: string
  verified: boolean
  city: string
  state: string
  zip: string
  profession: string[]
}

export interface ProfileReview {
  name: string
  rating: number
  text: string
}

export interface ProfileService {
  title: string
  description: string
  icon: string
}

export interface ProfileExperience {
  title: string
  date_label: string
  description: string
}

export interface ProfileCredential {
  title: string
  subtitle: string
}

export interface FullProfile extends DirectoryProfessional {
  bio_short: string
  bio_full: string[]
  firm_name: string
  years_experience: number
  headline: string
  credential_badges: Array<{ label: string; style_key: string }>
  services: ProfileService[]
  reviews: ProfileReview[]
  review_summary: { average_rating: number; review_count: number }
  quick_stats: Array<{ label: string; value: string }>
  client_types: string[]
  credentials: string[]
  experience: ProfileExperience[]
  licenses: ProfileCredential[]
  contact_email: string
  phone: string
  website: string
  availability: string
  languages: string[]
  years_experience_label: string
  rating_label: string
  booking_url: string
}

/* ── Profile data ── */

const profiles: FullProfile[] = [
  {
    professional_id: 'sample-sarah-mitchell',
    name: 'Sarah Mitchell',
    title: 'Tax Litigation & IRS Audit Defense Specialist',
    specialty: ['Attorney', 'CPA'],
    location: 'Los Angeles, CA',
    avatar_url: '',
    verified: true,
    city: 'Los Angeles',
    state: 'CA',
    zip: '90012',
    profession: ['Attorney', 'CPA'],
    bio_short: 'Tax litigation and IRS audit defense specialist with deep controversy experience.',
    bio_full: [
      'Sarah Mitchell is a seasoned tax professional with more than 20 years of experience helping clients navigate compliance, planning, and higher-stakes tax matters.',
      'At Mitchell Tax Law, the practice emphasizes clear communication, structured workflows, and practical recommendations tailored to each client\u2019s facts and filing posture.',
      'Clients value Sarah for thoughtful strategy, reliable follow-through, and the ability to translate technical tax issues into plain English without the usual nonsense.',
    ],
    firm_name: 'Mitchell Tax Law',
    years_experience: 20,
    headline: 'Tax Litigation & IRS Audit Defense Specialist',
    credential_badges: [
      { label: 'Attorney', style_key: 'attorney' },
      { label: 'CPA', style_key: 'cpa' },
      { label: 'Featured', style_key: 'featured' },
    ],
    services: [
      { title: 'Tax Litigation', description: 'Representation in Tax Court and federal district court proceedings.', icon: 'shield-check' },
      { title: 'Audit Defense', description: 'Comprehensive IRS audit representation and negotiation.', icon: 'file-check' },
      { title: 'Tax Planning', description: 'Strategic tax planning to reduce liability and improve readiness.', icon: 'target' },
      { title: 'Appeals', description: 'IRS Appeals Office and administrative review representation.', icon: 'scale-3' },
      { title: 'Compliance', description: 'Tax compliance and audit readiness consulting.', icon: 'book-open' },
      { title: 'Consulting', description: 'Expert witness and litigation support services.', icon: 'users' },
    ],
    reviews: [
      { name: 'John D.', rating: 5, text: 'Exceptional representation during my audit. Sarah\'s expertise saved me thousands.' },
      { name: 'Michael R.', rating: 5, text: 'Highly recommended. Professional, knowledgeable, and results-oriented.' },
      { name: 'Leah P.', rating: 5, text: 'Strong strategist and relentless advocate when the stakes were high.' },
    ],
    review_summary: { average_rating: 5.0, review_count: 48 },
    quick_stats: [
      { label: 'Years of Experience', value: '20+' },
      { label: 'Cases Handled', value: '500+' },
      { label: 'Success Rate', value: '98%' },
      { label: 'Client Reviews', value: '48' },
    ],
    client_types: ['Individuals', 'Businesses', 'C Corporations', 'S Corporations', 'Partnerships', 'LLCs', 'Nonprofits', 'Executives'],
    credentials: ['CPA (Certified Public Accountant)', 'Juris Doctor (J.D.)', 'IRS Form 2848 Power of Attorney', 'Board Certified Tax Specialist'],
    experience: [
      { title: 'Founder & Principal, Mitchell Tax Law', date_label: '2008 - Present', description: 'Founded and grew a practice focused on tax litigation and audit defense.' },
      { title: 'Senior Tax Attorney, Major Accounting Firm', date_label: '2003 - 2008', description: 'Led tax controversy work involving complex matters for business and individual clients.' },
      { title: 'Revenue Agent, IRS', date_label: '2001 - 2003', description: 'Built expertise in audit procedures and IRS enforcement processes.' },
    ],
    licenses: [
      { title: 'CPA (Certified Public Accountant)', subtitle: 'California, Active since 2003' },
      { title: 'Juris Doctor (J.D.)', subtitle: 'UCLA School of Law, Licensed to practice in California' },
      { title: 'IRS Form 2848 Power of Attorney', subtitle: 'Authorized to represent clients before the IRS' },
      { title: 'Board Certified Tax Specialist', subtitle: 'State Bar of California Tax Law Certification' },
    ],
    contact_email: 'sarah@mitchelltaxlaw.com',
    phone: '(213) 555-1234',
    website: 'https://www.mitchelltaxlaw.com',
    availability: 'Mon-Fri, 9AM-5PM PT',
    languages: ['English', 'Spanish'],
    years_experience_label: '20+ Years Experience',
    rating_label: '4.9/5 (48 reviews)',
    booking_url: 'https://www.mitchelltaxlaw.com/book',
  },
  {
    professional_id: 'sample-amanda-garcia',
    name: 'Amanda Garcia',
    title: 'International Tax & Expat Filing Specialist',
    specialty: ['CPA'],
    location: 'Miami, FL',
    avatar_url: '',
    verified: true,
    city: 'Miami',
    state: 'FL',
    zip: '33101',
    profession: ['CPA'],
    bio_short: 'Remote-first CPA practice serving U.S. expats and internationally mobile taxpayers.',
    bio_full: [
      'Amanda Garcia is a seasoned tax professional with more than 12 years of experience helping clients navigate compliance, planning, and higher-stakes tax matters.',
      'At Garcia Global Tax, the practice emphasizes clear communication, structured workflows, and practical recommendations tailored to each client\u2019s facts and filing posture.',
      'Clients value Amanda for thoughtful strategy, reliable follow-through, and the ability to translate technical tax issues into plain English without the usual nonsense.',
    ],
    firm_name: 'Garcia Global Tax',
    years_experience: 12,
    headline: 'International Tax & Expat Filing Specialist',
    credential_badges: [{ label: 'CPA', style_key: 'cpa' }],
    services: [
      { title: 'Foreign Reporting (FBAR/FATCA)', description: 'FBAR, FATCA, and cross-border reporting support for individuals and families.', icon: 'globe' },
      { title: 'Tax Monitoring', description: 'Ongoing monitoring to flag account changes, notices, and filing risks early.', icon: 'shield-check' },
      { title: 'Tax Preparation', description: 'Individual and small business preparation with multi-jurisdiction coordination.', icon: 'calculator' },
      { title: 'Tax Resolution', description: 'Guidance for notices, balances due, and transcript-based issue triage.', icon: 'file-check' },
      { title: 'Tax Planning', description: 'Forward-looking planning for expatriates, contractors, and globally mobile clients.', icon: 'target' },
      { title: 'Compliance', description: 'Tax compliance and audit readiness consulting across U.S. reporting obligations.', icon: 'book-open' },
    ],
    reviews: [
      { name: 'Melissa T.', rating: 5, text: 'Amanda made expat filing much less stressful and caught issues my prior preparer missed.' },
      { name: 'Carlos V.', rating: 5, text: 'Clear advice, quick turnaround, and very strong international knowledge.' },
      { name: 'Priya N.', rating: 4, text: 'Professional and organized throughout a complicated multi-country filing.' },
    ],
    review_summary: { average_rating: 4.7, review_count: 39 },
    quick_stats: [
      { label: 'Years of Experience', value: '12+' },
      { label: 'Returns Filed', value: '1,200+' },
      { label: 'Client Reviews', value: '32' },
      { label: 'Specialty Cases', value: '300+' },
    ],
    client_types: ['Individuals', 'Businesses', 'LLCs', 'S Corporations'],
    credentials: ['CPA (Certified Public Accountant)', 'IRS Annual Filing Season Program', 'International Tax Advisory Practice'],
    experience: [
      { title: 'Founder, Garcia Global Tax', date_label: '2018 - Present', description: 'Built a remote tax practice serving expatriates, consultants, and small business owners worldwide.' },
      { title: 'Senior Tax Manager, Regional CPA Firm', date_label: '2014 - 2018', description: 'Led complex individual and small business return preparation with international reporting needs.' },
      { title: 'Tax Associate, Public Accounting Firm', date_label: '2011 - 2014', description: 'Supported federal and state compliance projects for growing businesses and high-income taxpayers.' },
    ],
    licenses: [
      { title: 'CPA (Certified Public Accountant)', subtitle: 'Florida, Active since 2014' },
      { title: 'IRS Annual Filing Season Program', subtitle: 'Continuing compliance and annual training' },
      { title: 'International Tax Advisory Practice', subtitle: 'Focused on expatriate, treaty, and reporting matters' },
    ],
    contact_email: 'amanda@garciaglobaltax.com',
    phone: '(305) 555-0142',
    website: 'https://www.garciaglobaltax.com',
    availability: 'Mon-Fri, 9AM-5PM ET',
    languages: ['English', 'Spanish'],
    years_experience_label: '12+ Years Experience',
    rating_label: '4.8/5 (32 reviews)',
    booking_url: 'https://www.garciaglobaltax.com/book',
  },
  {
    professional_id: 'sample-david-chen',
    name: 'David Chen',
    title: 'Tax Controversy & Estate Planning Attorney',
    specialty: ['Attorney'],
    location: 'San Diego, CA',
    avatar_url: '',
    verified: true,
    city: 'San Diego',
    state: 'CA',
    zip: '92101',
    profession: ['Attorney'],
    bio_short: 'Tax attorney focused on controversy, estate planning, and wealth transfer strategy.',
    bio_full: [
      'David Chen is a seasoned tax professional with more than 18 years of experience helping clients navigate compliance, planning, and higher-stakes tax matters.',
      'At Chen Tax Counsel, the practice emphasizes clear communication, structured workflows, and practical recommendations tailored to each client\u2019s facts and filing posture.',
      'Clients value David for thoughtful strategy, reliable follow-through, and the ability to translate technical tax issues into plain English without the usual nonsense.',
    ],
    firm_name: 'Chen Tax Counsel',
    years_experience: 18,
    headline: 'Tax Controversy & Estate Planning Attorney',
    credential_badges: [{ label: 'Attorney', style_key: 'attorney' }],
    services: [
      { title: 'Estate & Trust Tax', description: 'Planning and compliance for estates, trusts, and generational wealth transfer.', icon: 'briefcase' },
      { title: 'Appeals', description: 'IRS Appeals Office and administrative review representation.', icon: 'scale-3' },
      { title: 'Tax Litigation', description: 'Representation in Tax Court and federal district court proceedings.', icon: 'gavel' },
      { title: 'Tax Planning', description: 'Strategic planning for owners, families, and trusts with complex tax exposure.', icon: 'target' },
      { title: 'Consulting', description: 'Advisory support for counsel, fiduciaries, and closely held businesses.', icon: 'users' },
      { title: 'Compliance', description: 'Tax compliance and audit readiness consulting.', icon: 'book-open' },
    ],
    reviews: [
      { name: 'Helen S.', rating: 5, text: 'David was measured, strategic, and incredibly sharp during our appeals process.' },
      { name: 'Jason K.', rating: 5, text: 'Excellent planning advice for our family business and trust structure.' },
      { name: 'Robert M.', rating: 5, text: 'Strong communicator and very thoughtful legal analysis.' },
    ],
    review_summary: { average_rating: 5.0, review_count: 39 },
    quick_stats: [
      { label: 'Years of Experience', value: '18+' },
      { label: 'Plans Drafted', value: '700+' },
      { label: 'Client Reviews', value: '41' },
      { label: 'Tax Matters Resolved', value: '250+' },
    ],
    client_types: ['Individuals', 'Businesses', 'Nonprofits', 'Executives'],
    credentials: ['Juris Doctor (J.D.)', 'LL.M. in Taxation', 'IRS Form 2848 Power of Attorney'],
    experience: [
      { title: 'Founder, Chen Tax Counsel', date_label: '2015 - Present', description: 'Advises families and business owners on estate structuring, controversy defense, and tax-sensitive transactions.' },
      { title: 'Tax Attorney, National Law Firm', date_label: '2010 - 2015', description: 'Handled federal controversy, tax planning, and appeals matters for high-net-worth clients.' },
      { title: 'Associate Attorney, Boutique Tax Practice', date_label: '2007 - 2010', description: 'Focused on trust, estate, and business tax matters.' },
    ],
    licenses: [
      { title: 'Juris Doctor (J.D.)', subtitle: 'University of California, Active California Bar Member' },
      { title: 'LL.M. in Taxation', subtitle: 'Advanced study in estate, gift, and controversy matters' },
      { title: 'IRS Form 2848 Power of Attorney', subtitle: 'Authorized to represent clients before the IRS' },
    ],
    contact_email: 'david@chentaxcounsel.com',
    phone: '(619) 555-0108',
    website: 'https://www.chentaxcounsel.com',
    availability: 'Mon-Fri, 9AM-5PM PT',
    languages: ['Chinese', 'English'],
    years_experience_label: '18+ Years Experience',
    rating_label: '4.9/5 (41 reviews)',
    booking_url: 'https://www.chentaxcounsel.com/book',
  },
  {
    professional_id: 'sample-emily-wong',
    name: 'Emily Wong',
    title: 'Small Business CPA & R&D Credit Advisor',
    specialty: ['CPA'],
    location: 'San Francisco, CA',
    avatar_url: '',
    verified: true,
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    profession: ['CPA'],
    bio_short: 'Small business CPA specializing in startup tax strategy, compliance, and R&D credit planning.',
    bio_full: [
      'Emily Wong is a seasoned tax professional with more than 14 years of experience helping clients navigate compliance, planning, and higher-stakes tax matters.',
      'At Wong Advisory CPA, the practice emphasizes clear communication, structured workflows, and practical recommendations tailored to each client\u2019s facts and filing posture.',
      'Clients value Emily for thoughtful strategy, reliable follow-through, and the ability to translate technical tax issues into plain English without the usual nonsense.',
    ],
    firm_name: 'Wong Advisory CPA',
    years_experience: 14,
    headline: 'Small Business CPA & R&D Credit Advisor',
    credential_badges: [
      { label: 'CPA', style_key: 'cpa' },
      { label: 'Featured', style_key: 'featured' },
    ],
    services: [
      { title: 'Business Tax Advisory', description: 'Entity, compensation, and growth-stage advisory for founders and operators.', icon: 'briefcase' },
      { title: 'Tax Preparation', description: 'Business and founder returns with close coordination across tax years.', icon: 'calculator' },
      { title: 'Tax Planning', description: 'Strategic planning to improve readiness and reduce tax drag as companies scale.', icon: 'target' },
      { title: 'Compliance', description: 'Tax compliance and audit readiness consulting for startups and service firms.', icon: 'book-open' },
      { title: 'Consulting', description: 'Fractional tax advisory and board-ready reporting support.', icon: 'users' },
      { title: 'Tax Monitoring', description: 'Transcript and notice monitoring to identify issues before they escalate.', icon: 'shield-check' },
    ],
    reviews: [
      { name: 'Nina P.', rating: 5, text: 'Emily helped us clean up years of startup tax confusion and found credits we had missed.' },
      { name: 'Eric L.', rating: 5, text: 'Very sharp, practical, and easy to work with.' },
      { name: 'Ben H.', rating: 4, text: 'Strong guidance and excellent follow-through for a fast-moving team.' },
    ],
    review_summary: { average_rating: 4.7, review_count: 48 },
    quick_stats: [
      { label: 'Years of Experience', value: '14+' },
      { label: 'Clients Served', value: '800+' },
      { label: 'Client Reviews', value: '44' },
      { label: 'Credits Secured', value: '$9M+' },
    ],
    client_types: ['Businesses', 'Executives', 'LLCs', 'S Corporations'],
    credentials: ['CPA (Certified Public Accountant)', 'Research Credit Advisory', 'Startup Finance & Tax Advisory'],
    experience: [
      { title: 'Founder, Wong Advisory CPA', date_label: '2019 - Present', description: 'Built a boutique CPA firm serving startups, agencies, and founder-led businesses.' },
      { title: 'Senior Manager, Venture-Focused CPA Firm', date_label: '2014 - 2019', description: 'Advised venture-backed clients on compliance, planning, and tax credit opportunities.' },
      { title: 'Audit & Tax Associate, Public Accounting', date_label: '2010 - 2014', description: 'Worked across audit, tax prep, and financial reporting for growing companies.' },
    ],
    licenses: [
      { title: 'CPA (Certified Public Accountant)', subtitle: 'California, Active since 2012' },
      { title: 'Research Credit Advisory', subtitle: 'Experience documenting and defending credit methodology' },
      { title: 'Startup Finance & Tax Advisory', subtitle: 'Cross-functional support for founders and finance teams' },
    ],
    contact_email: 'emily@wongadvisorycpa.com',
    phone: '(415) 555-0194',
    website: 'https://www.wongadvisorycpa.com',
    availability: 'Mon-Fri, 9AM-5PM PT',
    languages: ['Chinese', 'English'],
    years_experience_label: '14+ Years Experience',
    rating_label: '4.9/5 (44 reviews)',
    booking_url: 'https://www.wongadvisorycpa.com/book',
  },
  {
    professional_id: 'sample-james-rodriguez',
    name: 'James Rodriguez',
    title: 'Enrolled Agent for International & IRS Resolution Matters',
    specialty: ['Enrolled Agent'],
    location: 'Austin, TX',
    avatar_url: '',
    verified: true,
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    profession: ['Enrolled Agent'],
    bio_short: 'Enrolled Agent specializing in expat matters, notices, collections, and IRS resolution work.',
    bio_full: [
      'James Rodriguez is a seasoned tax professional with more than 16 years of experience helping clients navigate compliance, planning, and higher-stakes tax matters.',
      'At Rodriguez Tax Resolution, the practice emphasizes clear communication, structured workflows, and practical recommendations tailored to each client\u2019s facts and filing posture.',
      'Clients value James for thoughtful strategy, reliable follow-through, and the ability to translate technical tax issues into plain English without the usual nonsense.',
    ],
    firm_name: 'Rodriguez Tax Resolution',
    years_experience: 16,
    headline: 'Enrolled Agent for International & IRS Resolution Matters',
    credential_badges: [
      { label: 'EA', style_key: 'ea' },
      { label: 'Featured', style_key: 'featured' },
    ],
    services: [
      { title: 'IRS Collections Defense', description: 'Representation for balances due, levy risk, and active collections matters.', icon: 'shield-check' },
      { title: 'Offer in Compromise', description: 'Evaluation, preparation, and negotiation of compromise submissions.', icon: 'file-check' },
      { title: 'Penalty Abatement', description: 'Requests and advocacy to reduce or remove qualifying penalties.', icon: 'target' },
      { title: 'Tax Resolution', description: 'Comprehensive IRS resolution support for notices, balances, and collection strategy.', icon: 'users' },
      { title: 'Foreign Reporting (FBAR/FATCA)', description: 'Support for delinquent international reporting and compliance cleanup.', icon: 'globe' },
      { title: 'Tax Monitoring', description: 'Ongoing transcript and notice monitoring to catch new IRS actions early.', icon: 'book-open' },
    ],
    reviews: [
      { name: 'Angela R.', rating: 5, text: 'James took control of a scary collections case and explained every step.' },
      { name: 'Omar T.', rating: 5, text: 'Great with IRS notices and very calm under pressure.' },
      { name: 'Linda C.', rating: 5, text: 'Strong communicator and got us into a workable resolution quickly.' },
    ],
    review_summary: { average_rating: 5.0, review_count: 48 },
    quick_stats: [
      { label: 'Years of Experience', value: '16+' },
      { label: 'Cases Resolved', value: '1,000+' },
      { label: 'Client Reviews', value: '53' },
      { label: 'Plans Negotiated', value: '400+' },
    ],
    client_types: ['Individuals', 'Businesses', 'LLCs', 'Partnerships'],
    credentials: ['Enrolled Agent', 'IRS Collections & Resolution Practice', 'International Compliance Support'],
    experience: [
      { title: 'Principal, Rodriguez Tax Resolution', date_label: '2017 - Present', description: 'Leads a practice focused on collections defense, notice response, and international compliance issues.' },
      { title: 'Senior Resolution Specialist, National Tax Firm', date_label: '2011 - 2017', description: 'Managed high-volume IRS resolution matters and negotiated payment alternatives.' },
      { title: 'Tax Advisor, Small Business Practice', date_label: '2008 - 2011', description: 'Handled compliance, payroll, and notice response for owner-operated companies.' },
    ],
    licenses: [
      { title: 'Enrolled Agent', subtitle: 'Federally authorized to represent taxpayers before the IRS' },
      { title: 'IRS Collections & Resolution Practice', subtitle: 'Focused on installment agreements, CNC, and compromise strategy' },
      { title: 'International Compliance Support', subtitle: 'Experience with offshore reporting and remedial filing matters' },
    ],
    contact_email: 'james@rodrigueztaxresolution.com',
    phone: '(512) 555-0176',
    website: 'https://www.rodrigueztaxresolution.com',
    availability: 'Mon-Fri, 9AM-5PM CT',
    languages: ['English', 'Spanish'],
    years_experience_label: '16+ Years Experience',
    rating_label: '4.9/5 (53 reviews)',
    booking_url: 'https://www.rodrigueztaxresolution.com/book',
  },
  {
    professional_id: 'sample-jennifer-lee',
    name: 'Jennifer Lee',
    title: 'Dual-Credentialed Tax Advisor for Estate, Nonprofit & Complex Planning',
    specialty: ['Attorney', 'CPA'],
    location: 'Seattle, WA',
    avatar_url: '',
    verified: true,
    city: 'Seattle',
    state: 'WA',
    zip: '98101',
    profession: ['Attorney', 'CPA'],
    bio_short: 'Attorney-CPA serving families, nonprofits, and closely held businesses with advanced planning needs.',
    bio_full: [
      'Jennifer Lee is a seasoned tax professional with more than 21 years of experience helping clients navigate compliance, planning, and higher-stakes tax matters.',
      'At Lee Tax Strategy Group, the practice emphasizes clear communication, structured workflows, and practical recommendations tailored to each client\u2019s facts and filing posture.',
      'Clients value Jennifer for thoughtful strategy, reliable follow-through, and the ability to translate technical tax issues into plain English without the usual nonsense.',
    ],
    firm_name: 'Lee Tax Strategy Group',
    years_experience: 21,
    headline: 'Dual-Credentialed Tax Advisor for Estate, Nonprofit & Complex Planning',
    credential_badges: [
      { label: 'Attorney', style_key: 'attorney' },
      { label: 'CPA', style_key: 'cpa' },
    ],
    services: [
      { title: 'Estate & Trust Tax', description: 'Planning and compliance support for trusts, estates, and multigenerational transfers.', icon: 'briefcase' },
      { title: 'Business Tax Advisory', description: 'Strategic structuring for owners, family businesses, and advisory-heavy organizations.', icon: 'calculator' },
      { title: 'Tax Planning', description: 'Forward-looking planning for transactions, succession, and entity optimization.', icon: 'target' },
      { title: 'Compliance', description: 'Tax compliance and readiness consulting for nonprofits and operating businesses.', icon: 'book-open' },
      { title: 'Consulting', description: 'High-level advisory and technical review for complex planning questions.', icon: 'users' },
      { title: 'Appeals', description: 'Administrative review support when planning issues turn into controversies.', icon: 'scale-3' },
    ],
    reviews: [
      { name: 'Grace Y.', rating: 5, text: 'Jennifer brought structure and clarity to a very complex family planning project.' },
      { name: 'Mark E.', rating: 4, text: 'Thoughtful and highly technical, especially on nonprofit issues.' },
      { name: 'Sonia P.', rating: 5, text: 'Exactly the kind of dual-credentialed advisor we needed.' },
    ],
    review_summary: { average_rating: 4.7, review_count: 39 },
    quick_stats: [
      { label: 'Years of Experience', value: '21+' },
      { label: 'Plans Structured', value: '900+' },
      { label: 'Client Reviews', value: '37' },
      { label: 'Complex Matters', value: '350+' },
    ],
    client_types: ['Businesses', 'Individuals', 'Nonprofits', 'Executives'],
    credentials: ['CPA (Certified Public Accountant)', 'Juris Doctor (J.D.)', 'Nonprofit Tax Advisory'],
    experience: [
      { title: 'Managing Partner, Lee Tax Strategy Group', date_label: '2012 - Present', description: 'Leads advanced planning work for families, nonprofit leaders, and closely held businesses.' },
      { title: 'Tax Director, Regional Advisory Firm', date_label: '2006 - 2012', description: 'Oversaw planning, entity structuring, and exempt organization consulting.' },
      { title: 'Attorney-Accountant, Private Practice', date_label: '2003 - 2006', description: 'Worked across tax research, compliance, and family office planning matters.' },
    ],
    licenses: [
      { title: 'CPA (Certified Public Accountant)', subtitle: 'Washington, Active since 2004' },
      { title: 'Juris Doctor (J.D.)', subtitle: 'Licensed attorney with focus on tax-sensitive planning' },
      { title: 'Nonprofit Tax Advisory', subtitle: 'Experience serving exempt organizations and their leadership' },
    ],
    contact_email: 'jennifer@leetaxstrategy.com',
    phone: '(206) 555-0182',
    website: 'https://www.leetaxstrategy.com',
    availability: 'Mon-Fri, 9AM-5PM PT',
    languages: ['English', 'Korean'],
    years_experience_label: '21+ Years Experience',
    rating_label: '4.8/5 (37 reviews)',
    booking_url: 'https://www.leetaxstrategy.com/book',
  },
  {
    professional_id: 'sample-kevin-nakamura',
    name: 'Kevin Nakamura',
    title: 'Pension Funding & Retirement Plan Compliance Specialist',
    specialty: ['Enrolled Actuary'],
    location: 'Honolulu, HI',
    avatar_url: '',
    verified: true,
    city: 'Honolulu',
    state: 'HI',
    zip: '96813',
    profession: ['Enrolled Actuary'],
    bio_short: 'Enrolled Actuary focused on pension funding, plan compliance, and retirement program design.',
    bio_full: [
      'Kevin Nakamura is a seasoned tax professional with more than 19 years of experience helping clients navigate compliance, planning, and higher-stakes tax matters.',
      'At Nakamura Pension Advisory, the practice emphasizes clear communication, structured workflows, and practical recommendations tailored to each client\u2019s facts and filing posture.',
      'Clients value Kevin for thoughtful strategy, reliable follow-through, and the ability to translate technical tax issues into plain English without the usual nonsense.',
    ],
    firm_name: 'Nakamura Pension Advisory',
    years_experience: 19,
    headline: 'Pension Funding & Retirement Plan Compliance Specialist',
    credential_badges: [{ label: 'Enrolled Actuary', style_key: 'custom' }],
    services: [
      { title: 'Compliance', description: 'Retirement plan compliance and funding review for employers and plan sponsors.', icon: 'book-open' },
      { title: 'Consulting', description: 'Ongoing actuarial and plan administration advisory support.', icon: 'users' },
      { title: 'Business Tax Advisory', description: 'Coordination of retirement strategy with owner compensation and business planning.', icon: 'briefcase' },
      { title: 'Tax Planning', description: 'Retirement and deferred compensation planning for owners and executives.', icon: 'target' },
      { title: 'Payroll Tax Defense', description: 'Support where payroll reporting issues intersect with benefit structures.', icon: 'calculator' },
      { title: 'Tax Monitoring', description: 'Periodic monitoring to flag notice or transcript changes tied to plan activity.', icon: 'shield-check' },
    ],
    reviews: [
      { name: 'Dana L.', rating: 5, text: 'Kevin made a very technical retirement plan issue understandable and actionable.' },
      { name: 'Paul R.', rating: 4, text: 'Strong actuarial knowledge and dependable follow-through.' },
      { name: 'Alicia M.', rating: 5, text: 'Very helpful with compliance coordination across our advisors.' },
    ],
    review_summary: { average_rating: 4.7, review_count: 39 },
    quick_stats: [
      { label: 'Years of Experience', value: '19+' },
      { label: 'Plans Managed', value: '500+' },
      { label: 'Client Reviews', value: '26' },
      { label: 'Compliance Projects', value: '300+' },
    ],
    client_types: ['Businesses', 'Executives', 'Nonprofits', 'S Corporations'],
    credentials: ['Enrolled Actuary', 'Pension Funding Advisory', 'Retirement Plan Administration'],
    experience: [
      { title: 'Principal, Nakamura Pension Advisory', date_label: '2016 - Present', description: 'Advises employers on pension funding, compliance, and retirement plan design.' },
      { title: 'Senior Actuarial Consultant, National Benefits Firm', date_label: '2009 - 2016', description: 'Led actuarial valuations and compliance reviews for mid-market employers.' },
      { title: 'Actuarial Analyst, Retirement Services Group', date_label: '2005 - 2009', description: 'Supported plan modeling, reporting, and sponsor communications.' },
    ],
    licenses: [
      { title: 'Enrolled Actuary', subtitle: 'Authorized to practice before the IRS on actuarial matters' },
      { title: 'Pension Funding Advisory', subtitle: 'Experience with defined benefit design and ongoing compliance' },
      { title: 'Retirement Plan Administration', subtitle: 'Coordination with TPAs, ERISA counsel, and finance teams' },
    ],
    contact_email: 'kevin@nakamurapension.com',
    phone: '(808) 555-0127',
    website: 'https://www.nakamurapension.com',
    availability: 'Mon-Fri, 9AM-5PM HST',
    languages: ['English', 'Japanese'],
    years_experience_label: '19+ Years Experience',
    rating_label: '4.7/5 (26 reviews)',
    booking_url: 'https://www.nakamurapension.com/book',
  },
  {
    professional_id: 'sample-lisa-park',
    name: 'Lisa Park',
    title: 'Former IRS Examiner Focused on Audit Defense',
    specialty: ['Enrolled Agent'],
    location: 'Denver, CO',
    avatar_url: '',
    verified: true,
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    profession: ['Enrolled Agent'],
    bio_short: 'Former IRS examiner offering audit defense, notice response, and tax prep support.',
    bio_full: [
      'Lisa Park is a seasoned tax professional with more than 11 years of experience helping clients navigate compliance, planning, and higher-stakes tax matters.',
      'At Park Audit Defense, the practice emphasizes clear communication, structured workflows, and practical recommendations tailored to each client\u2019s facts and filing posture.',
      'Clients value Lisa for thoughtful strategy, reliable follow-through, and the ability to translate technical tax issues into plain English without the usual nonsense.',
    ],
    firm_name: 'Park Audit Defense',
    years_experience: 11,
    headline: 'Former IRS Examiner Focused on Audit Defense',
    credential_badges: [{ label: 'EA', style_key: 'ea' }],
    services: [
      { title: 'Audit Defense', description: 'Comprehensive IRS audit representation and negotiation.', icon: 'file-check' },
      { title: 'Tax Preparation', description: 'Preparation and cleanup work aligned to audit-ready documentation.', icon: 'calculator' },
      { title: 'Compliance', description: 'Tax compliance and audit readiness consulting.', icon: 'book-open' },
      { title: 'Appeals', description: 'Administrative review and appeals support when examinations escalate.', icon: 'scale-3' },
      { title: 'Tax Monitoring', description: 'Monitoring to flag transcript changes, notices, and account movement.', icon: 'shield-check' },
      { title: 'Penalty Abatement', description: 'Requests and advocacy for penalty relief where facts support it.', icon: 'target' },
    ],
    reviews: [
      { name: 'Kevin S.', rating: 5, text: 'Lisa understood the audit process from the inside and it showed.' },
      { name: 'Maria G.', rating: 5, text: 'Very organized and reassuring during a stressful audit.' },
      { name: 'Tina P.', rating: 4, text: 'Good communication and strong documentation support.' },
    ],
    review_summary: { average_rating: 4.7, review_count: 39 },
    quick_stats: [
      { label: 'Years of Experience', value: '11+' },
      { label: 'Audits Managed', value: '450+' },
      { label: 'Client Reviews', value: '35' },
      { label: 'Returns Prepared', value: '900+' },
    ],
    client_types: ['Individuals', 'Businesses', 'LLCs', 'S Corporations'],
    credentials: ['Enrolled Agent', 'Former IRS Examiner', 'IRS Notice Response Practice'],
    experience: [
      { title: 'Founder, Park Audit Defense', date_label: '2020 - Present', description: 'Built a practice centered on audit defense and transcript-based issue response.' },
      { title: 'IRS Examiner', date_label: '2015 - 2020', description: 'Reviewed returns, supporting documentation, and exam-related correspondence.' },
      { title: 'Tax Associate, Regional Firm', date_label: '2013 - 2015', description: 'Prepared individual and business returns and assisted with notice response.' },
    ],
    licenses: [
      { title: 'Enrolled Agent', subtitle: 'Federally authorized to represent taxpayers before the IRS' },
      { title: 'Former IRS Examiner', subtitle: 'Direct experience with examination processes and document requests' },
      { title: 'IRS Notice Response Practice', subtitle: 'Focused on transcripts, notices, and audit defense preparation' },
    ],
    contact_email: 'lisa@parkauditdefense.com',
    phone: '(303) 555-0135',
    website: 'https://www.parkauditdefense.com',
    availability: 'Mon-Fri, 9AM-5PM MT',
    languages: ['English', 'Korean'],
    years_experience_label: '11+ Years Experience',
    rating_label: '4.8/5 (35 reviews)',
    booking_url: 'https://www.parkauditdefense.com/book',
  },
  {
    professional_id: 'sample-michael-johnson',
    name: 'Michael Johnson',
    title: 'CPA for Small Business Tax, Bookkeeping & Planning',
    specialty: ['CPA'],
    location: 'Chicago, IL',
    avatar_url: '',
    verified: true,
    city: 'Chicago',
    state: 'IL',
    zip: '60601',
    profession: ['CPA'],
    bio_short: 'CPA offering tax preparation, planning, and bookkeeping for small businesses and individuals.',
    bio_full: [
      'Michael Johnson is a seasoned tax professional with more than 15 years of experience helping clients navigate compliance, planning, and higher-stakes tax matters.',
      'At Johnson CPA Advisory, the practice emphasizes clear communication, structured workflows, and practical recommendations tailored to each client\u2019s facts and filing posture.',
      'Clients value Michael for thoughtful strategy, reliable follow-through, and the ability to translate technical tax issues into plain English without the usual nonsense.',
    ],
    firm_name: 'Johnson CPA Advisory',
    years_experience: 15,
    headline: 'CPA for Small Business Tax, Bookkeeping & Planning',
    credential_badges: [{ label: 'CPA', style_key: 'cpa' }],
    services: [
      { title: 'Tax Preparation', description: 'Individual and business return preparation with year-round support.', icon: 'calculator' },
      { title: 'Business Tax Advisory', description: 'Practical advisory for owner compensation, entity planning, and margin protection.', icon: 'briefcase' },
      { title: 'Tax Planning', description: 'Quarterly and annual planning to improve tax readiness and decision-making.', icon: 'target' },
      { title: 'Compliance', description: 'Tax compliance and audit readiness consulting for service businesses.', icon: 'book-open' },
      { title: 'Tax Monitoring', description: 'Monitoring to catch notices, changes, and unresolved account issues early.', icon: 'shield-check' },
      { title: 'Consulting', description: 'Advisory support for systems cleanup, reporting, and workflow improvement.', icon: 'users' },
    ],
    reviews: [
      { name: 'Lauren H.', rating: 5, text: 'Michael cleaned up our books and gave us much better visibility into taxes.' },
      { name: 'Chris W.', rating: 4, text: 'Solid CPA and very practical for small business owners.' },
      { name: 'Alana D.', rating: 5, text: 'Reliable, responsive, and good at explaining the why behind the numbers.' },
    ],
    review_summary: { average_rating: 4.7, review_count: 39 },
    quick_stats: [
      { label: 'Years of Experience', value: '15+' },
      { label: 'Clients Served', value: '650+' },
      { label: 'Client Reviews', value: '29' },
      { label: 'Books Cleaned Up', value: '400+' },
    ],
    client_types: ['Businesses', 'Individuals', 'LLCs', 'S Corporations'],
    credentials: ['CPA (Certified Public Accountant)', 'Small Business Advisory Practice', 'Bookkeeping Systems Cleanup'],
    experience: [
      { title: 'Principal, Johnson CPA Advisory', date_label: '2018 - Present', description: 'Leads a CPA practice serving small businesses with tax and financial clarity.' },
      { title: 'Tax Manager, Mid-Market CPA Firm', date_label: '2012 - 2018', description: 'Handled compliance, planning, and review for owner-managed businesses.' },
      { title: 'Staff Accountant, Public Accounting', date_label: '2009 - 2012', description: 'Worked on bookkeeping, compilations, and tax prep across industries.' },
    ],
    licenses: [
      { title: 'CPA (Certified Public Accountant)', subtitle: 'Illinois, Active since 2010' },
      { title: 'Small Business Advisory Practice', subtitle: 'Experience with service firms, consultants, and owner-managed entities' },
      { title: 'Bookkeeping Systems Cleanup', subtitle: 'Focused on tax-ready books and process discipline' },
    ],
    contact_email: 'michael@johnsoncpaadvisory.com',
    phone: '(312) 555-0159',
    website: 'https://www.johnsoncpaadvisory.com',
    availability: 'Mon-Fri, 9AM-5PM CT',
    languages: ['English'],
    years_experience_label: '15+ Years Experience',
    rating_label: '4.7/5 (29 reviews)',
    booking_url: 'https://www.johnsoncpaadvisory.com/book',
  },
  {
    professional_id: 'sample-rachel-brooks',
    name: 'Rachel Brooks',
    title: 'ERPA Focused on Retirement Plan Compliance & Administration',
    specialty: ['ERPA'],
    location: 'Atlanta, GA',
    avatar_url: '',
    verified: true,
    city: 'Atlanta',
    state: 'GA',
    zip: '30303',
    profession: ['ERPA'],
    bio_short: 'ERPA specializing in retirement plan compliance, reporting, and sponsor support.',
    bio_full: [
      'Rachel Brooks is a seasoned tax professional with more than 13 years of experience helping clients navigate compliance, planning, and higher-stakes tax matters.',
      'At Brooks Retirement Compliance, the practice emphasizes clear communication, structured workflows, and practical recommendations tailored to each client\u2019s facts and filing posture.',
      'Clients value Rachel for thoughtful strategy, reliable follow-through, and the ability to translate technical tax issues into plain English without the usual nonsense.',
    ],
    firm_name: 'Brooks Retirement Compliance',
    years_experience: 13,
    headline: 'ERPA Focused on Retirement Plan Compliance & Administration',
    credential_badges: [{ label: 'ERPA', style_key: 'custom' }],
    services: [
      { title: 'Compliance', description: 'Retirement plan compliance review, testing coordination, and corrective guidance.', icon: 'book-open' },
      { title: 'Consulting', description: 'Operational consulting for sponsors, TPAs, and finance teams.', icon: 'users' },
      { title: 'Business Tax Advisory', description: 'Benefit design and compliance considerations for employer tax planning.', icon: 'briefcase' },
      { title: 'Tax Planning', description: 'Coordination of retirement contribution strategy with business goals.', icon: 'target' },
      { title: 'Payroll Tax Defense', description: 'Support where payroll and benefit reporting issues overlap.', icon: 'calculator' },
      { title: 'Tax Monitoring', description: 'Monitoring account activity and notices related to plan compliance follow-up.', icon: 'shield-check' },
    ],
    reviews: [
      { name: 'Jeff M.', rating: 5, text: 'Rachel helped us untangle a retirement compliance issue without making it overwhelming.' },
      { name: 'Carla N.', rating: 4, text: 'Detailed, reliable, and easy to work with.' },
      { name: 'Monica F.', rating: 5, text: 'Excellent support across a messy correction project.' },
    ],
    review_summary: { average_rating: 4.7, review_count: 39 },
    quick_stats: [
      { label: 'Years of Experience', value: '13+' },
      { label: 'Plans Supported', value: '420+' },
      { label: 'Client Reviews', value: '24' },
      { label: 'Corrections Managed', value: '180+' },
    ],
    client_types: ['Businesses', 'Executives', 'Nonprofits', 'S Corporations'],
    credentials: ['Enrolled Retirement Plan Agent (ERPA)', 'Retirement Plan Operations', 'Compliance Coordination'],
    experience: [
      { title: 'Principal, Brooks Retirement Compliance', date_label: '2021 - Present', description: 'Advises employers on plan operations, reporting, and correction strategy.' },
      { title: 'Senior Compliance Consultant, Retirement Services Firm', date_label: '2015 - 2021', description: 'Managed retirement plan compliance reviews and sponsor communications.' },
      { title: 'Plan Administrator, Benefits Advisory Group', date_label: '2012 - 2015', description: 'Supported plan documentation, testing workflows, and client service.' },
    ],
    licenses: [
      { title: 'Enrolled Retirement Plan Agent (ERPA)', subtitle: 'Authorized to practice before the IRS on retirement plan matters' },
      { title: 'Retirement Plan Operations', subtitle: 'Experience with correction programs and sponsor remediation' },
      { title: 'Compliance Coordination', subtitle: 'Works closely with TPAs, payroll, and finance stakeholders' },
    ],
    contact_email: 'rachel@brooksretirement.com',
    phone: '(404) 555-0114',
    website: 'https://www.brooksretirement.com',
    availability: 'Mon-Fri, 9AM-5PM ET',
    languages: ['English'],
    years_experience_label: '13+ Years Experience',
    rating_label: '4.8/5 (24 reviews)',
    booking_url: 'https://www.brooksretirement.com/book',
  },
  {
    professional_id: 'sample-steven-roberts',
    name: 'Steven Roberts',
    title: 'EA for Individual Returns, Rentals, Equity Compensation & Crypto',
    specialty: ['Enrolled Agent'],
    location: 'Phoenix, AZ',
    avatar_url: '',
    verified: true,
    city: 'Phoenix',
    state: 'AZ',
    zip: '85004',
    profession: ['Enrolled Agent'],
    bio_short: 'EA focused on individual returns involving rentals, stock options, and crypto tax issues.',
    bio_full: [
      'Steven Roberts is a seasoned tax professional with more than 10 years of experience helping clients navigate compliance, planning, and higher-stakes tax matters.',
      'At Roberts Tax Solutions, the practice emphasizes clear communication, structured workflows, and practical recommendations tailored to each client\u2019s facts and filing posture.',
      'Clients value Steven for thoughtful strategy, reliable follow-through, and the ability to translate technical tax issues into plain English without the usual nonsense.',
    ],
    firm_name: 'Roberts Tax Solutions',
    years_experience: 10,
    headline: 'EA for Individual Returns, Rentals, Equity Compensation & Crypto',
    credential_badges: [{ label: 'EA', style_key: 'ea' }],
    services: [
      { title: 'Tax Preparation', description: 'Individual return preparation for multi-issue, high-complexity tax profiles.', icon: 'calculator' },
      { title: 'Tax Planning', description: 'Planning around equity compensation, estimated taxes, and timing decisions.', icon: 'target' },
      { title: 'Compliance', description: 'Tax compliance and audit readiness consulting for investors and landlords.', icon: 'book-open' },
      { title: 'Tax Monitoring', description: 'Monitoring notices and account changes tied to filing and payment risk.', icon: 'shield-check' },
      { title: 'Consulting', description: 'Support for transaction-heavy tax years and documentation strategy.', icon: 'users' },
      { title: 'Penalty Abatement', description: 'Requests for relief where filing or payment penalties can be challenged.', icon: 'file-check' },
    ],
    reviews: [
      { name: 'Derek B.', rating: 5, text: 'Steven handled a messy stock and crypto year with zero drama.' },
      { name: 'Holly T.', rating: 4, text: 'Good explanations and strong follow-through.' },
      { name: 'Mina K.', rating: 5, text: 'Very helpful with rentals and estimated tax planning.' },
    ],
    review_summary: { average_rating: 4.7, review_count: 39 },
    quick_stats: [
      { label: 'Years of Experience', value: '10+' },
      { label: 'Returns Filed', value: '1,100+' },
      { label: 'Client Reviews', value: '28' },
      { label: 'Complex Cases', value: '260+' },
    ],
    client_types: ['Individuals', 'Executives', 'LLCs', 'Partnerships'],
    credentials: ['Enrolled Agent', 'Investor Tax Practice', 'IRS Notice Support'],
    experience: [
      { title: 'Founder, Roberts Tax Solutions', date_label: '2021 - Present', description: 'Serves individuals with increasingly complex filing and reporting needs.' },
      { title: 'Senior Tax Advisor, Multi-Office Tax Practice', date_label: '2017 - 2021', description: 'Handled investor, rental, and high-income individual returns.' },
      { title: 'Tax Preparer, Boutique Firm', date_label: '2014 - 2017', description: 'Prepared returns and supported client communications and cleanup work.' },
    ],
    licenses: [
      { title: 'Enrolled Agent', subtitle: 'Federally authorized to represent taxpayers before the IRS' },
      { title: 'Investor Tax Practice', subtitle: 'Experience with rentals, equity awards, and digital asset reporting' },
      { title: 'IRS Notice Support', subtitle: 'Focused on transcript review and issue triage for individuals' },
    ],
    contact_email: 'steven@robertstaxsolutions.com',
    phone: '(602) 555-0168',
    website: 'https://www.robertstaxsolutions.com',
    availability: 'Mon-Fri, 9AM-5PM MT',
    languages: ['English'],
    years_experience_label: '10+ Years Experience',
    rating_label: '4.7/5 (28 reviews)',
    booking_url: 'https://www.robertstaxsolutions.com/book',
  },
  {
    professional_id: 'sample-thomas-wilson',
    name: 'Thomas Wilson',
    title: 'Enrolled Agent for Payroll, Bookkeeping & Small Business Tax',
    specialty: ['Enrolled Agent'],
    location: 'Nashville, TN',
    avatar_url: '',
    verified: true,
    city: 'Nashville',
    state: 'TN',
    zip: '37203',
    profession: ['Enrolled Agent'],
    bio_short: 'Enrolled Agent delivering bookkeeping, payroll, and tax support for small businesses.',
    bio_full: [
      'Thomas Wilson is a seasoned tax professional with more than 17 years of experience helping clients navigate compliance, planning, and higher-stakes tax matters.',
      'At Wilson Small Business Tax, the practice emphasizes clear communication, structured workflows, and practical recommendations tailored to each client\u2019s facts and filing posture.',
      'Clients value Thomas for thoughtful strategy, reliable follow-through, and the ability to translate technical tax issues into plain English without the usual nonsense.',
    ],
    firm_name: 'Wilson Small Business Tax',
    years_experience: 17,
    headline: 'Enrolled Agent for Payroll, Bookkeeping & Small Business Tax',
    credential_badges: [{ label: 'EA', style_key: 'ea' }],
    services: [
      { title: 'Business Tax Advisory', description: 'Practical tax strategy for owner-operated businesses and service firms.', icon: 'briefcase' },
      { title: 'Compliance', description: 'Tax compliance and audit readiness consulting for small business operations.', icon: 'book-open' },
      { title: 'Payroll Tax Defense', description: 'Support for payroll notices, reconciliations, and reporting issues.', icon: 'calculator' },
      { title: 'Tax Preparation', description: 'Business and owner return preparation with bookkeeping coordination.', icon: 'file-check' },
      { title: 'Tax Resolution', description: 'Help with notices, balances, and payment strategy for operating businesses.', icon: 'shield-check' },
      { title: 'Tax Monitoring', description: 'Monitoring to catch new IRS activity, notice issuance, and compliance drift.', icon: 'target' },
    ],
    reviews: [
      { name: 'Amber C.', rating: 5, text: 'Thomas is dependable and understands the day-to-day realities of small business.' },
      { name: 'Greg H.', rating: 5, text: 'Huge help on payroll notices and ongoing compliance.' },
      { name: 'Rita S.', rating: 4, text: 'Very practical and easy to work with month after month.' },
    ],
    review_summary: { average_rating: 4.7, review_count: 39 },
    quick_stats: [
      { label: 'Years of Experience', value: '17+' },
      { label: 'Businesses Served', value: '700+' },
      { label: 'Client Reviews', value: '34' },
      { label: 'Payroll Runs Managed', value: '10,000+' },
    ],
    client_types: ['Businesses', 'LLCs', 'Partnerships', 'S Corporations'],
    credentials: ['Enrolled Agent', 'Payroll & Bookkeeping Practice', 'IRS Notice Response'],
    experience: [
      { title: 'Owner, Wilson Small Business Tax', date_label: '2016 - Present', description: 'Built a firm focused on recurring support for small business clients.' },
      { title: 'Senior EA, Payroll & Tax Services Firm', date_label: '2010 - 2016', description: 'Managed payroll tax issues, returns, and compliance systems for employers.' },
      { title: 'Bookkeeper & Tax Advisor, Local Practice', date_label: '2007 - 2010', description: 'Handled bookkeeping, payroll processing, and year-end tax prep.' },
    ],
    licenses: [
      { title: 'Enrolled Agent', subtitle: 'Federally authorized to represent taxpayers before the IRS' },
      { title: 'Payroll & Bookkeeping Practice', subtitle: 'Focused on ongoing operational support for business owners' },
      { title: 'IRS Notice Response', subtitle: 'Experience with payroll and small business notice workflows' },
    ],
    contact_email: 'thomas@wilsonsmallbusinesstax.com',
    phone: '(615) 555-0188',
    website: 'https://www.wilsonsmallbusinesstax.com',
    availability: 'Mon-Fri, 9AM-5PM CT',
    languages: ['English'],
    years_experience_label: '17+ Years Experience',
    rating_label: '4.8/5 (34 reviews)',
    booking_url: 'https://www.wilsonsmallbusinesstax.com/book',
  },
]

/* ── Exports ── */

/** All sample profiles with full detail */
export const sampleProfiles = profiles

/** Lookup a full profile by slug (professional_id) */
export function getSampleProfile(id: string): FullProfile | undefined {
  return profiles.find((p) => p.professional_id === id)
}

/** Map for specialty filter values → profession array matching */
const SPECIALTY_MAP: Record<string, string> = {
  attorney: 'Attorney',
  cpa: 'CPA',
  ea: 'Enrolled Agent',
  erpa: 'ERPA',
  actuary: 'Enrolled Actuary',
}

/** Filter sample profiles client-side (same params as API) */
export function filterSampleProfiles(params?: {
  specialty?: string
  city?: string
  state?: string
  zip?: string
}): FullProfile[] {
  let result = profiles

  if (params?.specialty) {
    const target = SPECIALTY_MAP[params.specialty] || params.specialty
    result = result.filter((p) =>
      p.profession.some(
        (prof) => prof.toLowerCase() === target.toLowerCase()
      )
    )
  }

  if (params?.city) {
    const q = params.city.toLowerCase()
    result = result.filter((p) => p.city.toLowerCase().includes(q))
  }

  if (params?.state) {
    const q = params.state.toUpperCase()
    result = result.filter((p) => p.state.toUpperCase() === q)
  }

  if (params?.zip) {
    result = result.filter((p) => p.zip.startsWith(params.zip!))
  }

  return result
}
