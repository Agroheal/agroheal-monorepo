import { useEffect, useState } from "react";
import { FileText, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { updateConfig } from "@/lib/adminActions";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const DEFAULT_AGREEMENT = `# AGROHEAL SOLUTIONS LTD.
## LEARN TO EARN AGRIBUSINESS PLATFORM (LEAP)
### PARTICIPATION AGREEMENT & INTEGRATED PROGRAMME SCHEDULE

---

### PART A — LEAP PARTICIPATION AGREEMENT

#### 1. PARTIES & ACCEPTANCE
This Agreement is between Agroheal Solutions Ltd. (“Agroheal”) and every person registered to participate in the Learn to Earn Agribusiness Platform (“LEAP”) (“Participant”).

It takes effect when a Participant registers, electronically accepts these terms or makes an applicable programme payment.

---

#### 2. PURPOSE OF LEAP
LEAP is an agricultural learning, organic food production and market-development platform designed to enable Participants to:

**LEARN. PRACTICE. PRODUCE. MARKET. EARN.**

LEAP seeks to involve Participants in organic food production at three interconnected levels:
- **HOME** — grow food around their homes;
- **COMMUNITY** — grow food cooperatively within their local communities; and
- **GROUP FARMING** — participate in coordinated commercial-scale agricultural production.

The broader goal is to promote healthy food production, food security, practical agribusiness skills, community cooperation, enterprise and wealth creation.

---

#### 3. NATURE OF PARTICIPATION
a. LEAP promotes active participation in agriculture and agribusiness and is not represented as a bank deposit, savings product, fixed-income product or guaranteed-return investment.

b. Participants engage in learning, food production, Group Farming, coordination, market development, consumption and distribution of agricultural products.

c. Participation does not create an employer-employee relationship or confer ownership of land or fixed assets unless separately agreed in writing.

---

#### 4. LEAP PARTICIPATION STRUCTURE
The Agroheal Green Card Community Programme is the entry point for new LEAP Participants.

Participation progresses through:
a. GREEN CARD
b. HOME FOOD PRODUCTION
c. COMMUNITY FOOD PRODUCTION
d. GROUP COMMERCIAL FARMING

Group Farming is built around MUSHROOM VILLAGE, GINGERTOWN AND ORGANIC FOODNATION, with Mushroom Village being the flagship LEAP Group Farming programme.

These activities are expected to operate simultaneously. A Participant may grow food at home, participate in a Community Farm and participate in Group Farming at the same time.

---

#### 5. RESPONSIBILITIES OF AGROHEAL
Agroheal shall, as applicable:
a. provide LEAP learning resources;
b. facilitate Home, Community and Group Farming;
c. provide or facilitate agronomic and technical support;
d. facilitate access to land, production facilities and inputs where applicable;
e. provide production planning and oversight;
f. support processing and value addition;
g. facilitate local and export market opportunities;
h. promote appropriate farm security and risk-management measures, where applicable; and
i. maintain reasonable production and financial transparency.

Market facilitation does not guarantee any particular buyer, price or date of sale.

---

#### 6. RESPONSIBILITIES OF PARTICIPANTS
Participants shall, as applicable:
a. undertake LEAP learning;
b. endeavour to practise food production around their homes;
c. participate in Community Farming;
d. fulfil applicable Group Farm responsibilities;
e. pay applicable programme contributions;
f. comply with production, organic farming and biosecurity protocols;
g. participate responsibly in designated coordination platforms; and
h. protect Community and Group Farm resources.

---

#### 7. FARM COORDINATORS & COMMUNITY LEADERS
a. Group Farm Coordinators shall coordinate Participants, farm activities, records, reporting and communication with Agroheal.
b. Community Leaders shall mobilise and coordinate Green Card Holders and support Community Farming activities.
c. Applicable allowances, referral or performance incentives shall be stated in the relevant Programme Offer or Compensation Schedule and shall be subject to applicable conditions.

---

#### 8. PAYMENTS & FARM CONTRIBUTIONS
Payments within LEAP includes:
a. Green Card Participation Fee — access to LEAP and applicable Community Programme opportunities;
b. Farm Set-Up Contribution — participation in a specified Group Farming production unit or Farm Slot; and
c. Other Programme Contributions — where applicable and disclosed in advance.
d. Payment for a Green Card does not by itself constitute purchase of a Group Farm Slot.
e. Farm contributions shall be applied towards genuine agricultural production costs including inputs, labour, facilities, infrastructure, security, processing, logistics and technical support.
f. Amounts already spent or irrevocably committed to programme operations are ordinarily non-refundable.

---

#### 9. FARM REVENUE, REINVESTMENT & SURPLUS
a. Farm revenue shall principally arise from agricultural production, processing, value addition and sales.
b. Farm accounts shall determine:
Gross Farm Revenue
– Production & Operating Costs
– Applicable Obligations & Reserves
= Available Farm Surplus

Where provided in the applicable Programme Schedule or Offer, part or all of Available Farm Surplus shall be reinvested to expand production or establish additional agricultural enterprises.
The balance available for Participants shall constitute Distributable Farm Surplus and shall be shared according to the applicable programme formula.

---

#### 10. PROJECTIONS & AGRICULTURAL RISK
a. Agriculture involves risks including weather, pests, diseases, crop or livestock losses, security incidents, input costs, market-price fluctuations and other circumstances beyond reasonable control.
b. Any stated yield, revenue, income, profit, percentage or return is a projection or target only unless expressly stated as an actual historical result.
c. Agroheal does not guarantee agricultural yields, profits or financial returns.

---

#### 11. PRODUCER-CONSUMER NETWORK
a. Agroheal shall operate a Producer-Consumer Network connecting agricultural production with consumers and markets.
b. Participants shall participate as producers, consumers, market builders, distributors or in other approved capacities.
c. Any referral, distribution, mobilisation or performance incentive shall be governed by the applicable Programme Offer or Compensation Schedule and shall be distinct from Group Farm surplus distributions.

---

#### 12. TRANSPARENCY & GOVERNANCE
a. Agroheal shall promote reasonable farm reporting, accounting and transparency.
c. Group Farms may establish management committees or cooperatives where appropriate.
d. Participants shall have access to information concerning the operations and financial performance of their applicable Group Farm.

---

#### 13. EXIT, DEFAULT & TERMINATION
a. A Participant may exit or transfer a Group Farm participation interest subject to applicable programme rules and production commitments.
b. Agroheal may suspend or terminate participation for material non-compliance, fraud, misconduct, failure to meet agreed obligations, misuse of farm assets or serious disruption of programme activities.
c. Where appropriate, reasonable opportunity shall be given to remedy a breach.

---

#### 14. CONFIDENTIALITY & INTELLECTUAL PROPERTY
a. Participants shall respect Agroheal's confidential information, proprietary learning materials, operational systems, trademarks and other intellectual property.
b. Participants may freely use authorised promotional materials and independently conduct legitimate agricultural businesses.

---

#### 15. DATA & PRIVACY
Agroheal may process Participant information reasonably required for registration, payments, communication, programme administration, farm coordination and legal obligations in accordance with applicable Nigerian data-protection laws and Agroheal's Privacy Policy.

---

#### 16. FORCE MAJEURE
No Party shall be liable for failure caused by circumstances reasonably beyond its control, including extreme weather, natural disasters, epidemics, conflict, government action or major infrastructure failure.

---

#### 17. AMENDMENTS
a. Agroheal may reasonably update operational rules and Programme Schedules in response to production, regulatory or economic conditions.
b. Material changes affecting Participants' financial obligations or substantive rights shall be communicated before taking effect, except where immediate change is required by law.

---

#### 18. DISPUTE RESOLUTION & GOVERNING LAW
a. Disputes shall first be addressed through good-faith internal resolution, followed where necessary by mediation and thereafter arbitration in Nigeria in accordance with applicable law.
b. This Agreement shall be governed by the laws of the Federal Republic of Nigeria.

---

#### 19. ELECTRONIC ACCEPTANCE
No physical signature is required.

A Participant accepts this Agreement by electronically confirming:
“I have read, understood and agree to the Agroheal LEAP Participation Agreement and applicable Programme Schedule/Offer. I understand that agriculture involves risk and that yields, profits and financial projections are not guaranteed.”

Agroheal may retain the Participant's electronic acceptance, date, time and applicable version of the terms.

---

### PART B — INTEGRATED PROGRAMME SCHEDULE
This Schedule forms part of the Agroheal LEAP Participation Agreement.

#### 1. GREEN CARD — ENTRY INTO LEAP
The Green Card Community Programme is the entry point for every new LEAP Participant.
The prevailing Green Card participation fee shall be displayed on the LEAP platform.
Green Card Holders gain access to applicable:
a. LEAP learning;
b. Home Food Production;
c. Community Farming;
d. Group Farming opportunities; and
e. Special production and market opportunities.

---

#### 2. HOME FOOD PRODUCTION
Every Green Card Holder is encouraged to become a food producer by growing suitable food around the home using available land, containers, sacks, beds or other suitable systems.
LEAP shall provide practical guidance for organic crop production and, where applicable, small-scale livestock production.
Objective: Every Participant becomes a food producer.

---

#### 3. GREEN CARD COMMUNITY FARMING
Green Card Holders are encouraged to organise locally into Green Card Communities and establish Community Gardens/Farms.
Qualifying communities shall receive Agroheal support including planting materials, technical guidance, production templates and market facilitation according to the prevailing Programme Offer.
Community Farming is intended to progressively build food-secure and economically productive communities.

---

#### 4. GROUP FARMING
Eligible Green Card Holders may additionally participate in larger-scale Group Farming.
The integrated Group Farming pathway is:
1. MUSHROOM VILLAGE (Flagship Group Farm)
2. GINGERTOWN
3. ORGANIC FOODNATION
The objective is to progressively create multiple agricultural production and income streams for participating farmers.

---

#### 5. MUSHROOM VILLAGE — FLAGSHIP GROUP FARM
Mushroom Village is the flagship and initial Group Farming enterprise under LEAP.
The current initial Farm Set-Up Contribution is:
**₦5,000 PER FARM SLOT**
A Farm Slot represents a production participation unit and does not confer ownership of land or fixed assets.

---

#### 6. MUSHROOM PRODUCTION & REINVESTMENT
Mushroom Village shall generally operate in approximately three-month production cycles.

**FIRST CYCLE**
The first production cycle is primarily for capacity building.
Subject to actual farm performance, surplus generated during the first cycle shall be reinvested with the objective of approximately doubling Mushroom production capacity.
Participants should therefore not ordinarily expect cash profit distribution from the first cycle.

**SECOND & SUBSEQUENT CYCLES**
From the second production cycle, eligible Participants may begin receiving distributions from actual Distributable Farm Surplus.
The current projected distribution shall be stated in the applicable Mushroom Village Programme Offer.
All such figures remain projections and are subject to actual farm performance.

---

#### 7. SCALE-UP TO GINGERTOWN & ORGANIC FOODNATION
Participants joining Mushroom Village acknowledge that the Group Farming model is designed to progressively scale from MUSHROOM VILLAGE into GINGERTOWN and ORGANIC FOODNATION.
Agroheal shall seek to use production growth, reinvestment, retained surplus and other legitimate programme resources to progressively establish the three agricultural enterprises.
The initial Mushroom Village contribution is therefore intended as the starting point for the integrated Group Farming scale-up model.
The timing and scale of Gingertown and Organic FoodNation shall depend upon actual production performance, available resources, land, planting materials, agronomic timing and prevailing economic conditions.

---

#### 8. THREE-PROJECT INCOME OBJECTIVE
The long-term objective is for eligible Group Farming Participants to have the opportunity to derive agricultural income from:
1. Mushroom Village
2. Gingertown
3. Organic FoodNation
Income from each enterprise shall depend upon its actual production, sales and Distributable Farm Surplus.

---

#### 9. PRODUCER-CONSUMER NETWORK
The Agroheal Producer-Consumer Network is intended to build markets alongside production by connecting food produced within the LEAP ecosystem directly with Participants and other consumers.
Participants may therefore progressively become:
a. PRODUCERS — growing food;
b. CONSUMERS — consuming healthy locally produced food;
c. MARKET BUILDERS — connecting products to consumers; and
d. EARNERS — benefiting, where applicable, from actual production and legitimate marketing activities.
Specific product, referral and compensation arrangements shall be contained in the applicable Programme Offer or Compensation Schedule.

---

#### 10. THE INTEGRATED LEAP MODEL
The complete LEAP pathway is:
- **GREEN CARD**: Join & Learn
- **HOME**: Grow Your Food
- **COMMUNITY**: Grow Food Together
- **MUSHROOM VILLAGE**: Produce at Scale
- **GINGERTOWN**: Diversify & Expand
- **ORGANIC FOODNATION**: Build an Integrated Food Economy

Participants may participate at several levels simultaneously.

**THE GOAL:**
- Every Participant a Food Producer.
- Every Community a Food-Producing Community.
- One Home & One Community at a Time.
- Commercial FoodHubs with Group Production, Processing, Farm to Table & Export Markets.

---

#### 11. PROGRAMME OFFERS
Current figures that may change according to production and economic conditions—including Farm Slot contributions, production quantities, cycle projections, projected distributions and compensation arrangements—may be stated in a Programme Offer presented before the Participant joins the applicable activity.
The Programme Offer forms part of the applicable terms accepted by the Participant.

---

#### 12. IMPORTANT ACKNOWLEDGEMENT
Participation in LEAP involves agricultural and commercial risk.
The establishment of Community Gardening/Farming, Mushroom Village, Gingertown and Organic FoodNation, expansion of production capacity and any projected Participant distributions are programme objectives and not guaranteed financial outcomes.
Actual distributions shall arise only from actual realised Distributable Farm Surplus.
`;

interface Props {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function LegalDocEditor({ onSuccess, onError }: Props) {
  const { isReadOnly } = useAdminAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("system_configs")
          .select("value")
          .eq("key", "legal_agreement")
          .maybeSingle();
        setText(data?.value?.content || DEFAULT_AGREEMENT);
      } catch {
        setText(DEFAULT_AGREEMENT);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (isReadOnly) {
      onError("Support role is Read-Only. Configuration changes require Administrator privileges.");
      return;
    }

    setSaving(true);
    try {
      await updateConfig({
        key: "legal_agreement",
        value: {
          title: "Agroheal Membership & Farm Terms of Service",
          content: text,
          require_on_signup: true,
          updated_at: new Date().toISOString(),
        },
      });
      onSuccess("Legal Agreement successfully updated and published system-wide!");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update policy document.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4.5 w-4.5 text-primary" /> Legal Agreement &amp; Terms of Service
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Update the dynamic agreement document displayed on the user dashboard and required during member
          registration.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading current agreement...
          </div>
        ) : (
          <Textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter Legal Agreement Terms in Markdown..."
            className="font-mono text-xs leading-relaxed"
          />
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={isReadOnly || saving || loading}
          className="w-full gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isReadOnly ? (
            <span className="flex items-center gap-1.5 text-xs">Read-Only Mode Active</span>
          ) : (
            <Send className="h-4 w-4" />
          )}
          {saving ? "Saving..." : isReadOnly ? "" : "Publish Updated Legal Agreement"}
        </Button>
      </CardContent>
    </Card>
  );
}
