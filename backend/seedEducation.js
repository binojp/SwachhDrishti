const mongoose = require("mongoose");
const dotenv = require("dotenv");
const EducationalContent = require("./models/EducationalContent");

dotenv.config();

const educationalData = [
  {
    title: "Battery Disposal Best Practices",
    topic: "battery-disposal",
    content: `Batteries contain harmful chemicals like lead, mercury, and cadmium that can contaminate soil and water if not disposed of properly. Never throw batteries in regular trash!

Proper battery disposal:
• Rechargeable batteries (Li-ion, NiMH) should be taken to designated recycling centers
• Single-use alkaline batteries can often be recycled at retail drop-off locations
• Car batteries must be returned to auto parts stores or recycling facilities
• Store used batteries in a cool, dry place until you can recycle them

By recycling batteries, you help recover valuable materials like cobalt, nickel, and lithium while preventing toxic substances from entering our environment.`,
    difficulty: "beginner",
    points: 50,
    estimatedTime: 5,
    tips: [
      "Tape the terminals of lithium batteries before recycling to prevent fires",
      "Many electronics stores offer free battery recycling programs",
      "Check your local municipality for battery collection events",
      "Never incinerate batteries - they can explode",
      "Rechargeable batteries can be reused hundreds of times before recycling"
    ]
  },
  {
    title: "Phone & Laptop Recycling Guide",
    topic: "phone-laptop-recycling",
    content: `Electronic devices like phones and laptops contain precious metals (gold, silver, copper) and rare earth elements that can be recovered and reused. Proper recycling prevents these valuable materials from ending up in landfills.

Before recycling your device:
• Back up all important data to cloud storage or external drive
• Perform a factory reset to erase personal information
• Remove SIM cards and memory cards
• Check if the manufacturer offers a trade-in or recycling program

Recycling options:
• Manufacturer take-back programs (Apple, Samsung, Dell, etc.)
• Certified waste recycling facilities
• Retailer recycling programs (Best Buy, Staples)
• Donate working devices to schools or charities

One million recycled phones can recover 35,000 lbs of copper, 772 lbs of silver, 75 lbs of gold, and 33 lbs of palladium!`,
    difficulty: "beginner",
    points: 50,
    estimatedTime: 7,
    tips: [
      "Wipe your device completely before recycling to protect your privacy",
      "Remove protective cases and accessories before recycling",
      "Working devices can be donated for reuse instead of recycling",
      "Check if your device qualifies for trade-in credit",
      "Never throw electronics in regular trash - it's illegal in many places"
    ]
  },
  {
    title: "Cable & Charger Management",
    topic: "cable-charger-management",
    content: `Old cables and chargers are often overlooked but contain valuable copper and other recyclable materials. Millions of tons of waste cables end up in landfills each year.
---
Why recycle cables and chargers:
• Copper recovery - cables contain high-quality copper wire
• Plastic recycling - outer insulation can be recycled
• Prevent environmental contamination from degrading materials
• Reduce demand for mining new copper

How to recycle:
• Bundle cables together with zip ties or rubber bands
• Take to waste recycling centers
• Some scrap metal yards accept cables for copper recovery
• Retailer take-back programs often accept cables
• Donate working chargers to schools or community centers

Pro tip: Standardize your cables to reduce waste. USB-C is becoming the universal standard, reducing the need for multiple cable types.`,
    difficulty: "beginner",
    points: 50,
    estimatedTime: 4,
    tips: [
      "Organize cables by type before recycling for easier processing",
      "Working chargers can be donated to reduce waste",
      "Avoid buying cheap, low-quality cables that break easily",
      "Use cable organizers to extend the life of your cables",
      "Consider wireless charging to reduce cable wear and tear"
    ]
  },
  {
    title: "Environmental Impact of Waste",
    topic: "environmental-impact",
    content: `Waste is the fastest-growing environmental challenge globally, with over 2 billion tons of municipal solid waste generated annually. Only a small percentage is properly recycled, leading to severe environmental and health consequences.

Environmental impacts:
• Toxic chemicals leach into soil and groundwater
• Air pollution from informal burning releases dioxins
• Loss of valuable materials that could be recovered and reused
• Contribution to climate change through resource extraction and manufacturing

Health impacts:
• Heavy metal exposure causes neurological damage, especially in children
• Respiratory problems from toxic fumes
• Contaminated water sources affect entire communities

The good news: Proper recycling can:
• Recover up to 95% of materials for reuse
• Reduce greenhouse gas emissions significantly compared to landfilling
• Prevent toxic contamination of ecosystems
• Create green jobs in the recycling industry

Every item you recycle makes a difference!`,
    difficulty: "intermediate",
    points: 75,
    estimatedTime: 8,
    tips: [
      "Recycling 1 million laptops saves energy equivalent to powering 3,500 homes for a year",
      "Conscious consumption is the first step in reducing waste",
      "Extended producer responsibility laws are making manufacturers responsible for their waste",
      "Your recycling choices directly impact global environmental health"
    ]
  },
  {
    title: "Plastic Recycling & Management",
    topic: "plastic-recycling",
    content: `Plastic pollution is one of the most pressing environmental issues. Understanding different types of plastics and how to recycle them is key to reducing your environmental footprint.

Common Plastic Types:
1. PET (Soda bottles, water bottles) - Highly recyclable
2. HDPE (Milk jugs, detergent bottles) - Highly recyclable
3. PVC (Piping, medical tubing) - Difficult to recycle
4. LDPE (Plastic bags, shrink wrap) - Recyclable at special locations
5. PP (Yogurt containers, bottle caps) - Becoming more widely recyclable
6. PS (Styrofoam, plastic cutlery) - Difficult to recycle

Tips for effective plastic recycling:
• Rinse containers to remove food residue
• Check the number in the recycling triangle
• Avoid single-use plastics whenever possible
• Support products made from recycled plastic`,
    difficulty: "beginner",
    points: 50,
    estimatedTime: 6,
    tips: [
      "Not all plastics are created equal; check local guidelines",
      "Plastic can take up to 500 years to decompose in a landfill",
      "Recycling plastic uses 88% less energy than making it from raw materials",
      "Microplastics have been found in almost every ecosystem on Earth"
    ]
  },
  {
    title: "Organic Waste & Composting",
    topic: "organic-waste",
    content: `Organic waste, such as food scraps and yard waste, makes up a large portion of our trash. Instead of letting it rot in a landfill, we can turn it into nutrient-rich soil through composting.

What can be composted:
• Fruit and vegetable scraps
• Coffee grounds and filters
• Eggshells
• Grass clippings and leaves
• Paper (in small amounts)

Benefits of composting:
• Reduces landfill waste and methane emissions
• Creates natural fertilizer for plants
• Improves soil health and water retention
• Saves money on expensive fertilizers`,
    difficulty: "beginner",
    points: 50,
    estimatedTime: 5,
    tips: [
      "Avoid composting meat, dairy, and oily foods in home bins",
      "Maintain a balance of 'green' (nitrogen) and 'brown' (carbon) materials",
      "Keep your compost pile moist but not soaking wet",
      "A healthy compost pile should smell like earth, not rot"
    ]
  },
  {
    title: "Universal Waste Sorting Techniques",
    topic: "sorting-techniques",
    content: `Proper sorting is crucial for efficient recycling and material recovery across all waste streams.

Main Waste Categories:
1. Recyclables (Plastic, Glass, Metal, Paper)
2. Organic (Food waste, yard trimmings)
3. Electronics (Batteries, phones, appliances)
4. Hazardous (Chemicals, paints, oils)
5. General/Landfill (Non-recyclable items)

Sorting tips:
• Keep recyclables clean and dry
• Separate items by material type
• Never mix hazardous waste with regular trash
• Use clearly labeled bins to help everyone sort correctly`,
    difficulty: "intermediate",
    points: 75,
    estimatedTime: 10,
    tips: [
      "Create separate bins for different electronics categories at home",
      "Label items with hazardous materials for recycler safety",
      "Keep original packaging for safe transport to recycling centers",
      "Consult your local recycling facility for specific sorting requirements",
      "Proper sorting increases recycling efficiency by up to 30%"
    ]
  },
  {
    title: "Hazardous Materials in Electronics",
    topic: "hazardous-materials",
    content: `Electronic devices contain numerous hazardous substances that require careful handling and specialized recycling processes. Understanding these materials helps you make informed decisions about specialized waste disposal.

Common hazardous materials in electronics:

Lead (Pb):
• Found in: Solder, CRT screens, batteries
• Health risks: Neurological damage, kidney problems, reproductive issues
• Why it's used: Excellent conductor, low melting point for solder

Mercury (Hg):
• Found in: LCD backlights, fluorescent lamps, switches
• Health risks: Brain and nervous system damage, especially dangerous for children
• Why it's used: Efficient light production, electrical conductivity

Cadmium (Cd):
• Found in: Rechargeable batteries, older semiconductors, pigments
• Health risks: Kidney damage, bone disease, cancer
• Why it's used: Excellent battery performance, corrosion resistance

Brominated Flame Retardants (BFRs):
• Found in: Plastic casings, circuit boards, cables
• Health risks: Hormone disruption, developmental problems
• Why it's used: Fire safety, prevents electrical fires

Beryllium (Be):
• Found in: Copper alloys, connectors
• Health risks: Lung disease, cancer
• Why it's used: Improves electrical conductivity and strength

Proper handling:
• Never disassemble hazardous items yourself
• Use certified recycling facilities for toxic materials
• Don't burn or incinerate waste
• Keep waste dry and intact until disposal
• Educate others about the dangers of improper disposal`,
    difficulty: "advanced",
    points: 100,
    estimatedTime: 12,
    tips: [
      "Newer electronics use fewer hazardous materials due to RoHS regulations",
      "CRT monitors and TVs are among the most hazardous waste items",
      "Certified recyclers must follow strict protocols for hazardous material handling",
      "Some materials like gold and silver in electronics are non-hazardous and valuable",
      "Always check for recycling certifications like R2 or e-Stewards"
    ]
  },
  {
    title: "Circular Economy & Electronics",
    topic: "circular-economy",
    content: `The circular economy model aims to eliminate waste by keeping products and materials in use for as long as possible. In electronics, this means designing for longevity, repair, reuse, and recycling.

Linear Economy (Current Model):
Take → Make → Use → Dispose
• Rapid resource depletion
• Massive waste generation
• Environmental degradation

Circular Economy (Sustainable Model):
Design → Use → Repair → Reuse → Recycle → Regenerate
• Resource efficiency
• Minimal waste
• Sustainable growth

Key principles for electronics:

1. Design for Longevity
   - Modular components for easy repair
   - Quality materials that last longer
   - Software updates for extended device life

2. Right to Repair
   - Access to spare parts and repair manuals
   - Tools and resources for self-repair
   - Independent repair shops

3. Reuse & Refurbishment
   - Extend device life through refurbishment
   - Second-hand markets reduce new production
   - Donation programs for working devices

4. Responsible Recycling
   - Material recovery and reuse
   - Closed-loop manufacturing
   - Zero waste to landfill

5. Conscious Consumption
   - Buy only what you need
   - Choose repairable, upgradeable devices
   - Support companies with take-back programs

Your role in the circular economy:
• Repair instead of replace when possible
• Buy refurbished or second-hand products
• Recycle responsibly at end of life
• Support right-to-repair legislation
• Choose brands committed to sustainability

Together, we can transition from a wasteful linear economy to a sustainable circular one!`,
    difficulty: "advanced",
    points: 100,
    estimatedTime: 15,
    tips: [
      "The circular economy could reduce electronic waste by 80% by 2030",
      "Fairphone and Framework are leading examples of circular design",
      "Extended producer responsibility makes manufacturers responsible for entire product lifecycle",
      "Leasing models (product-as-a-service) encourage circular practices",
      "Your purchasing decisions directly influence corporate sustainability practices"
    ]
  }
];

async function seedEducationalContent() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Clear existing content
    await EducationalContent.deleteMany({});
    console.log("Cleared existing educational content");

    // Insert new content
    await EducationalContent.insertMany(educationalData);
    console.log(`Successfully seeded ${educationalData.length} educational modules`);

    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding educational content:", error);
    process.exit(1);
  }
}

seedEducationalContent();
