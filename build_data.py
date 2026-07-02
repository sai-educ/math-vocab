import json, os, re

# ---------------------------------------------------------------------------
# Math Vocabulary Bank — K-5, Common Core aligned
# Schema: term, grade, domain_code, domain, standard, definition, example, misconception
# ---------------------------------------------------------------------------

DOMAIN_NAMES = {
    "CC": "Counting & Cardinality",
    "OA": "Operations & Algebraic Thinking",
    "NBT": "Number & Operations in Base Ten",
    "NF": "Number & Operations—Fractions",
    "MD": "Measurement & Data",
    "G": "Geometry",
}

# Each grade maps domain_code -> list of (term, definition, example, misconception)
DATA = {
"K": {
 "CC": [
  ("count", "Say numbers in order, one for each thing you touch.", "Count the apples: 1, 2, 3.", "Kids sometimes skip a number or count one object twice."),
  ("number", "A word or symbol that tells how many.", "The number 5 tells you there are five toys.", ""),
  ("more", "A bigger amount than another group.", "7 is more than 4.", "Kids may think 'more' means 'bigger size' instead of 'bigger amount.'"),
  ("fewer", "A smaller amount than another group.", "3 apples is fewer than 6 apples.", "Often confused with 'less,' which is used for amounts you can't count one by one."),
  ("equal", "The same amount as something else.", "3 and 3 are equal.", ""),
  ("greater than", "Has a bigger value.", "8 is greater than 5.", ""),
  ("less than", "Has a smaller value.", "2 is less than 9.", ""),
  ("one more", "The next number when you count up by one.", "One more than 4 is 5.", ""),
  ("zero", "A number that means none.", "There are zero cookies left.", ""),
  ("in order", "Numbers arranged from smallest to biggest, or in a counting sequence.", "Put the numbers in order: 1, 2, 3.", ""),
 ],
 "OA": [
  ("add", "Put groups together to find the total.", "Add 2 apples and 3 apples to get 5.", ""),
  ("subtract", "Take some away from a group to find what's left.", "Subtract 2 from 5 and 3 are left.", ""),
  ("sum", "The total you get after adding.", "The sum of 2 and 3 is 5.", "Kids sometimes mix up 'sum' (addition) with 'product' (multiplication)."),
  ("put together", "Combine two groups into one.", "Put together 3 red blocks and 2 blue blocks.", ""),
  ("take apart", "Split a group into smaller groups.", "Take apart 5 into 2 and 3.", ""),
  ("decompose", "Break a number into smaller parts.", "You can decompose 5 into 4 and 1.", "Sounds like a big word — it just means 'break apart.'"),
  ("equation", "A math sentence that shows two things are equal, using an = sign.", "3 + 2 = 5 is an equation.", ""),
  ("in all", "A phrase in word problems that usually means 'add to find the total.'", "How many toys in all?", ""),
  ("left", "A phrase in word problems that usually means 'subtract to find what remains.'", "How many are left?", "Kids may subtract when the problem actually needs the total, if they only look for keywords."),
 ],
 "NBT": [
  ("ten", "A group of ten ones.", "Ten ones make 1 ten.", ""),
  ("ones", "Single units, the numbers 1 through 9 in the ones place.", "13 has 1 ten and 3 ones.", ""),
  ("teen number", "A number from 11 to 19.", "14 is a teen number.", ""),
  ("compose", "Put smaller parts together to build a number.", "Compose 12 using 1 ten and 2 ones.", ""),
 ],
 "MD": [
  ("longer", "Has a greater length.", "The pencil is longer than the eraser.", ""),
  ("shorter", "Has a smaller length.", "The crayon is shorter than the ruler.", ""),
  ("taller", "Has a greater height.", "The tree is taller than the bush.", ""),
  ("heavier", "Weighs more.", "The rock is heavier than the leaf.", ""),
  ("lighter", "Weighs less.", "The feather is lighter than the book.", ""),
  ("measure", "Find the size, length, or amount of something.", "Measure the desk with blocks.", ""),
  ("compare", "Look at two things to see how they are alike or different.", "Compare the two lines to see which is longer.", ""),
  ("sort", "Put things into groups based on how they are alike.", "Sort the shapes by color.", ""),
  ("category", "A group of things that share something in common.", "Put all the circles in one category.", ""),
 ],
 "G": [
  ("shape", "The outline or form of an object.", "A circle is a round shape.", ""),
  ("circle", "A round shape with no corners.", "A clock face is shaped like a circle.", ""),
  ("triangle", "A shape with 3 straight sides and 3 corners.", "A slice of pizza looks like a triangle.", ""),
  ("square", "A shape with 4 equal straight sides and 4 corners.", "A napkin is often a square.", ""),
  ("rectangle", "A shape with 4 straight sides and 4 corners, opposite sides equal.", "A door is shaped like a rectangle.", "Kids sometimes think a square isn't a rectangle — but it is a special one."),
  ("hexagon", "A shape with 6 straight sides.", "A stop sign has 8 sides, but a honeycomb cell is a hexagon.", ""),
  ("cube", "A solid shape with 6 square faces.", "A die (dice) is shaped like a cube.", ""),
  ("sphere", "A solid, perfectly round shape like a ball.", "A basketball is a sphere.", ""),
  ("above", "In a higher position than something else.", "The bird is above the tree.", ""),
  ("below", "In a lower position than something else.", "The root is below the ground.", ""),
  ("beside", "Next to something.", "The cat sits beside the dog.", ""),
  ("corner", "The point where two sides of a shape meet.", "A square has 4 corners.", ""),
 ],
},
"1": {
 "OA": [
  ("addend", "A number being added to another number.", "In 3 + 4 = 7, 3 and 4 are addends.", ""),
  ("sum", "The answer when you add.", "The sum of 6 and 2 is 8.", ""),
  ("difference", "The answer when you subtract.", "The difference between 9 and 4 is 5.", "Kids sometimes think 'difference' means 'how different' in a general sense rather than the subtraction answer."),
  ("equation", "A math sentence with an equal sign showing two equal amounts.", "5 + 3 = 8 is an equation.", ""),
  ("unknown", "The missing number in a problem you need to find.", "Find the unknown: 4 + __ = 9.", ""),
  ("fact family", "A group of related addition and subtraction equations using the same three numbers.", "3 + 4 = 7 and 7 - 4 = 3 are in the same fact family.", ""),
  ("doubles", "Adding the same number to itself.", "4 + 4 is a doubles fact.", ""),
  ("compare", "In word problems, figure out how much more or less one amount is than another.", "How many more apples does Sam have than Mia?", ""),
  ("how many more", "A phrase that usually signals a comparison subtraction problem.", "How many more stickers does Ana need?", ""),
 ],
 "NBT": [
  ("place value", "The value of a digit based on its position in a number.", "In 42, the 4 is worth 4 tens.", ""),
  ("tens", "Groups of ten.", "30 has 3 tens.", ""),
  ("ones", "Single units left over after grouping by ten.", "23 has 2 tens and 3 ones.", ""),
  ("greater than (>)", "A symbol showing one number is bigger than another.", "12 > 8.", ""),
  ("less than (<)", "A symbol showing one number is smaller than another.", "5 < 9.", ""),
  ("equal to (=)", "A symbol showing two amounts are the same.", "10 = 10.", ""),
  ("count on", "Start at a number and count up to add.", "Count on from 5 to add 3: 6, 7, 8.", ""),
 ],
 "MD": [
  ("length", "How long something is from end to end.", "Measure the length of the table.", ""),
  ("measure", "Use a tool or unit to find a size or amount.", "Measure the string with paper clips.", ""),
  ("order by length", "Arrange objects from shortest to longest (or the reverse).", "Order the pencils by length.", ""),
  ("hour", "A unit of time equal to 60 minutes.", "The movie is one hour long.", ""),
  ("half hour", "30 minutes, or half of an hour.", "Recess is a half hour.", ""),
  ("data", "Information collected, often shown in a chart or graph.", "The class collected data about favorite fruits.", ""),
  ("tally chart", "A chart that uses marks to count things.", "Make a tally chart of pets in the class.", ""),
  ("graph", "A picture that shows information so it's easy to compare.", "The graph shows how many books each student read.", ""),
 ],
 "G": [
  ("partition", "Divide a shape into equal parts.", "Partition the rectangle into 2 equal parts.", ""),
  ("equal shares", "Parts of a whole that are the same size.", "Cut the pizza into 4 equal shares.", ""),
  ("halves", "Two equal parts of a whole.", "Cut the apple into halves.", ""),
  ("fourths", "Four equal parts of a whole.", "Fold the paper into fourths.", ""),
  ("quarters", "Another name for fourths — four equal parts.", "Each quarter of the circle is the same size.", "Can be confused with the coin worth 25 cents."),
  ("attribute", "A feature or characteristic of a shape, like number of sides.", "One attribute of a square is that it has 4 equal sides.", ""),
  ("2D shape", "A flat shape with length and width, like a circle or square.", "A triangle is a 2D shape.", ""),
  ("3D shape", "A solid shape with length, width, and height, like a cube.", "A ball is a 3D shape.", ""),
 ],
},
"2": {
 "OA": [
  ("repeated addition", "Adding the same number over and over.", "3 + 3 + 3 + 3 is repeated addition for 4 groups of 3.", ""),
  ("array", "Objects arranged in equal rows and columns.", "The array has 3 rows of 4 chairs.", ""),
  ("even number", "A number that can be split into two equal groups with none left over.", "8 is an even number.", ""),
  ("odd number", "A number that has one left over when split into two equal groups.", "7 is an odd number.", ""),
  ("two-step problem", "A word problem that needs two operations to solve.", "First add, then subtract to solve the two-step problem.", "Kids often stop after the first step instead of finishing both."),
  ("unknown number", "The missing value you're solving for.", "Solve for the unknown number in 6 + __ = 11.", ""),
 ],
 "NBT": [
  ("hundreds", "Groups of one hundred.", "300 has 3 hundreds.", ""),
  ("expanded form", "Writing a number to show the value of each digit.", "324 in expanded form is 300 + 20 + 4.", ""),
  ("place value", "The value of a digit based on where it sits in a number.", "In 356, the 5 is worth 50.", ""),
  ("regroup", "Trade 10 of one place value for 1 of the next (or the reverse) when adding or subtracting.", "Regroup 10 ones as 1 ten when adding.", "Sometimes called 'borrowing' or 'carrying,' which can confuse kids about what's actually happening."),
  ("compare numbers", "Decide if one number is greater than, less than, or equal to another.", "Compare 245 and 254 using >, <, or =.", ""),
 ],
 "MD": [
  ("centimeter", "A small unit of length in the metric system.", "The bug is 2 centimeters long.", ""),
  ("meter", "A unit of length equal to 100 centimeters.", "The rope is 1 meter long.", ""),
  ("estimate", "Make a smart guess about an amount using what you know.", "Estimate how many books are on the shelf.", ""),
  ("number line", "A line marked with numbers in order, used to add, subtract, or measure.", "Use a number line to add 4 + 3.", ""),
  ("bar graph", "A graph that uses bars to show and compare amounts.", "The bar graph shows favorite colors.", ""),
  ("picture graph", "A graph that uses pictures or symbols to show amounts.", "The picture graph shows how many pets each student has.", ""),
  ("line plot", "A graph that shows data with marks above a number line.", "Make a line plot of everyone's height.", ""),
  ("dollar", "A unit of money equal to 100 cents.", "The toy costs one dollar.", ""),
  ("quarter (coin)", "A coin worth 25 cents.", "Four quarters make one dollar.", ""),
 ],
 "G": [
  ("quadrilateral", "Any shape with 4 straight sides.", "Squares, rectangles, and trapezoids are all quadrilaterals.", ""),
  ("pentagon", "A shape with 5 straight sides.", "A home plate is shaped a bit like a pentagon.", ""),
  ("rows and columns", "Rows go across, columns go up and down, used to describe arrays.", "The array has 4 rows and 3 columns.", ""),
  ("equal shares", "Parts of a shape that are exactly the same size.", "Divide the rectangle into 3 equal shares.", ""),
 ],
},
"3": {
 "OA": [
  ("multiply", "Combine equal groups to find a total.", "Multiply 4 groups of 3 to get 12.", ""),
  ("factor", "A number multiplied with another number to get a product.", "3 and 4 are factors of 12.", ""),
  ("product", "The answer when you multiply.", "The product of 5 and 6 is 30.", "Kids sometimes confuse 'product' (multiplication answer) with 'sum' (addition answer)."),
  ("divide", "Split a total into equal groups.", "Divide 12 cookies into 3 equal groups.", ""),
  ("quotient", "The answer when you divide.", "The quotient of 12 divided by 4 is 3.", ""),
  ("equal groups", "Groups that all have the same number of items.", "There are 5 equal groups of 4 apples.", ""),
  ("array", "Objects in equal rows and columns, used to show multiplication.", "A 3-by-5 array shows 3 rows of 5.", ""),
  ("area model", "A rectangle diagram used to show multiplication.", "Use an area model to multiply 6 x 7.", ""),
  ("unknown factor", "A missing number in a multiplication or division equation.", "Find the unknown factor: 5 x __ = 35.", ""),
 ],
 "NBT": [
  ("round", "Change a number to the nearest ten or hundred to make it easier to work with.", "Round 47 to the nearest ten: 50.", ""),
  ("place value", "The value a digit has because of its position in the number.", "In 528, the 2 is worth 20.", ""),
 ],
 "NF": [
  ("fraction", "A number that names part of a whole or part of a group.", "1/2 is a fraction meaning one of two equal parts.", ""),
  ("numerator", "The top number in a fraction, showing how many parts you have.", "In 3/4, the numerator is 3.", ""),
  ("denominator", "The bottom number in a fraction, showing how many equal parts the whole is split into.", "In 3/4, the denominator is 4.", ""),
  ("unit fraction", "A fraction with 1 as the numerator.", "1/5 is a unit fraction.", ""),
  ("equivalent fractions", "Fractions that name the same amount even though they look different.", "1/2 and 2/4 are equivalent fractions.", ""),
  ("whole", "One complete thing, made of all its equal parts.", "4/4 makes one whole.", ""),
  ("partition", "Divide something into equal parts.", "Partition the circle into 3 equal parts.", ""),
  ("compare fractions", "Decide which fraction is bigger, smaller, or equal.", "Compare 1/3 and 1/4 to see which is greater.", "Kids often think a bigger denominator means a bigger fraction — it's actually the opposite for unit fractions."),
 ],
 "MD": [
  ("area", "The amount of flat space inside a shape, measured in square units.", "The area of the rug is 12 square feet.", ""),
  ("perimeter", "The distance around the outside of a shape.", "The perimeter of the garden is 20 feet.", "Kids often mix up area (inside space) and perimeter (outside distance)."),
  ("square unit", "A unit used to measure area, like a square inch or square centimeter.", "The area is 15 square units.", ""),
  ("elapsed time", "The amount of time that passes between a start time and an end time.", "Find the elapsed time between 2:00 and 3:15.", ""),
  ("liquid volume", "The amount of liquid something holds, measured in units like liters.", "The liquid volume of the bottle is 2 liters.", ""),
  ("mass", "How much matter is in an object, measured in units like grams.", "The mass of the apple is 150 grams.", ""),
  ("scaled graph", "A graph where each picture or bar unit stands for more than one item.", "On the scaled graph, each icon equals 5 votes.", ""),
 ],
 "G": [
  ("quadrilateral", "A shape with 4 straight sides.", "Rhombuses and trapezoids are quadrilaterals.", ""),
  ("category", "A group that shares an attribute, used to classify shapes.", "Sort the shapes into the quadrilateral category.", ""),
  ("attribute", "A defining feature of a shape, like the number of sides or angles.", "Right angles are an attribute of squares.", ""),
 ],
},
"4": {
 "OA": [
  ("factor", "A number that divides evenly into another number.", "2, 3, 4, and 6 are all factors of 12.", ""),
  ("multiple", "The result of multiplying a number by a whole number.", "12 is a multiple of 3.", "Kids often mix up 'factor' (numbers that multiply together) and 'multiple' (the result)."),
  ("prime number", "A number greater than 1 with only two factors: 1 and itself.", "7 is a prime number because only 1 x 7 equals 7.", ""),
  ("composite number", "A number with more than two factors.", "8 is composite because 1, 2, 4, and 8 are all factors.", ""),
  ("multi-step problem", "A word problem that requires more than one operation to solve.", "This multi-step problem needs both multiplication and subtraction.", ""),
  ("remainder", "The amount left over after dividing when the numbers don't divide evenly.", "13 divided by 4 is 3 with a remainder of 1.", ""),
  ("variable", "A letter or symbol that stands for an unknown number.", "In n + 5 = 12, n is the variable.", ""),
 ],
 "NBT": [
  ("place value", "The value of a digit based on its position, up to millions in grade 4.", "In 3,452,100, the 3 is worth 3 million.", ""),
  ("multi-digit", "A number with more than one digit.", "1,236 is a multi-digit number.", ""),
  ("standard algorithm", "The step-by-step method for adding, subtracting, multiplying, or dividing multi-digit numbers.", "Use the standard algorithm to multiply 234 x 6.", ""),
 ],
 "NF": [
  ("equivalent fraction", "A fraction that names the same value as another fraction.", "2/6 is equivalent to 1/3.", ""),
  ("mixed number", "A whole number combined with a fraction.", "2 1/2 is a mixed number.", ""),
  ("improper fraction", "A fraction where the numerator is greater than or equal to the denominator.", "7/4 is an improper fraction.", ""),
  ("common denominator", "A shared denominator used to add or compare fractions.", "Use a common denominator of 12 to add 1/3 and 1/4.", ""),
  ("decimal", "A number that uses a decimal point to show parts of a whole based on tens.", "0.5 is a decimal equal to 1/2.", ""),
  ("tenths", "Parts of a whole divided into 10 equal pieces.", "0.3 means three tenths.", ""),
  ("hundredths", "Parts of a whole divided into 100 equal pieces.", "0.07 means seven hundredths.", ""),
  ("benchmark fraction", "A common, easy-to-picture fraction (like 1/2) used to compare other fractions.", "Use the benchmark fraction 1/2 to guess if 3/5 is bigger or smaller.", ""),
 ],
 "MD": [
  ("angle", "The space between two lines or rays that meet at a point, measured in degrees.", "The corner of the door forms an angle.", ""),
  ("degree", "The unit used to measure the size of an angle.", "A right angle measures 90 degrees.", ""),
  ("protractor", "A tool used to measure angles.", "Use a protractor to measure the angle.", ""),
  ("perimeter", "The distance around the outside of a shape.", "Find the perimeter of the rectangular field.", ""),
  ("formula", "A rule written with symbols that shows how to calculate something.", "The formula for area of a rectangle is length x width.", ""),
  ("conversion", "Changing a measurement from one unit to another.", "Conversion of 3 feet to inches gives 36 inches.", ""),
 ],
 "G": [
  ("point", "An exact location in space, usually shown as a dot.", "Point A marks a spot on the line.", ""),
  ("line", "A straight path that goes on forever in both directions.", "Draw a line through both points.", ""),
  ("ray", "A straight path that starts at one point and goes on forever in one direction.", "A ray of light starts at the sun.", ""),
  ("acute angle", "An angle smaller than a right angle (less than 90 degrees).", "The tip of a slice of pizza is often an acute angle.", ""),
  ("obtuse angle", "An angle bigger than a right angle but smaller than a straight line (between 90 and 180 degrees).", "The angle looks wide open, like an obtuse angle.", ""),
  ("right angle", "An angle that measures exactly 90 degrees, like the corner of a square.", "The corner of a book forms a right angle.", ""),
  ("parallel lines", "Lines that never meet and always stay the same distance apart.", "Railroad tracks are parallel lines.", ""),
  ("perpendicular lines", "Lines that cross to form right angles.", "The two streets meet as perpendicular lines.", ""),
  ("line of symmetry", "A line that divides a shape into two matching mirror halves.", "A heart shape has a line of symmetry down the middle.", ""),
 ],
},
"5": {
 "OA": [
  ("order of operations", "The agreed-upon order for solving a math expression: parentheses first, then multiplication/division, then addition/subtraction.", "Use the order of operations to solve 3 + 4 x 2.", ""),
  ("parentheses", "Symbols ( ) that show which part of an expression to solve first.", "Solve what's inside the parentheses first.", ""),
  ("expression", "A math phrase with numbers and operations, but no equal sign.", "3 x (4 + 2) is an expression.", "Kids sometimes confuse an expression (no equal sign) with an equation (has an equal sign)."),
  ("evaluate", "Find the value of an expression by solving it.", "Evaluate the expression 5 + 3 x 2.", ""),
  ("numerical pattern", "A sequence of numbers that follows a rule.", "The numerical pattern adds 5 each time: 5, 10, 15, 20.", ""),
  ("coordinate pair", "Two numbers, written as (x, y), that name a point's location on a grid.", "The coordinate pair (3, 2) marks a point on the graph.", ""),
 ],
 "NBT": [
  ("exponent", "A small number that shows how many times to multiply a number by itself.", "In 10 to the power of 3, the exponent is 3.", ""),
  ("power of ten", "A number like 10, 100, or 1,000 made by multiplying 10 by itself.", "1,000 is a power of ten.", ""),
  ("round decimals", "Change a decimal to the nearest whole number, tenth, or hundredth.", "Round 3.47 to the nearest tenth: 3.5.", ""),
  ("multiply decimals", "Multiply numbers that include decimal points.", "Multiply decimals: 2.5 x 3 = 7.5.", ""),
  ("divide decimals", "Divide numbers that include decimal points.", "Divide decimals: 6.4 divided by 2 = 3.2.", ""),
 ],
 "NF": [
  ("common denominator", "A shared bottom number used to add, subtract, or compare fractions.", "Rewrite the fractions with a common denominator before adding.", ""),
  ("mixed number", "A whole number and a fraction together.", "3 1/4 is a mixed number.", ""),
  ("multiply fractions", "Find the product of two fractions.", "Multiply fractions: 1/2 x 2/3 = 2/6.", ""),
  ("divide fractions", "Find how many times one fraction fits into another.", "Divide fractions: 1/2 divided by 1/4 = 2.", ""),
  ("simplify", "Rewrite a fraction in its smallest, equivalent form.", "Simplify 4/8 to 1/2.", ""),
  ("reciprocal", "A fraction flipped upside down, used to divide fractions.", "The reciprocal of 2/3 is 3/2.", ""),
 ],
 "MD": [
  ("volume", "The amount of space a solid shape takes up, measured in cubic units.", "Find the volume of the box.", ""),
  ("cubic unit", "A unit used to measure volume, like a cubic inch.", "The volume is 24 cubic units.", ""),
  ("convert units", "Change a measurement from one unit to another, like feet to inches.", "Convert units: 5 feet equals 60 inches.", ""),
  ("coordinate plane", "A grid made of a horizontal and vertical number line, used to plot points.", "Plot the point on the coordinate plane.", ""),
  ("x-axis", "The horizontal number line on a coordinate plane.", "The point moves 3 spaces along the x-axis.", ""),
  ("y-axis", "The vertical number line on a coordinate plane.", "The point moves 2 spaces up the y-axis.", ""),
 ],
 "G": [
  ("coordinate plane", "A grid formed by a horizontal x-axis and vertical y-axis, used to locate points.", "Plot (4, 3) on the coordinate plane.", ""),
  ("ordered pair", "Two numbers (x, y) that give the exact location of a point on a grid.", "The ordered pair (2, 5) tells you where to plot the point.", ""),
  ("classify", "Sort shapes into groups based on shared attributes.", "Classify the triangles by their angles.", ""),
  ("hierarchy of shapes", "A way of organizing shapes to show how categories relate, like all squares are rectangles.", "The hierarchy of shapes shows that every square is also a rectangle.", ""),
 ],
},
}

STANDARD_PREFIX = {"K": "K", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5"}

def slugify(s):
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")

entries = []
for grade, domains in DATA.items():
    for dcode, terms in domains.items():
        dname = DOMAIN_NAMES[dcode]
        standard = f"{grade}.{dcode}"
        for term, definition, example, misconception in terms:
            entries.append({
                "id": slugify(f"{grade}-{dcode}-{term}"),
                "term": term,
                "grade": grade,
                "domainCode": dcode,
                "domain": dname,
                "standard": standard,
                "definition": definition,
                "example": example,
                "misconception": misconception,
            })

out_dir = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(out_dir, "vocab_data.json"), "w") as f:
    json.dump(entries, f, indent=2)

print(f"Wrote {len(entries)} terms across {len(DATA)} grades.")

# Also write per-grade markdown files (source of truth, git-friendly)
md_dir = os.path.join(out_dir, "vocab_bank")
os.makedirs(md_dir, exist_ok=True)
for grade, domains in DATA.items():
    lines = [f"# Grade {grade} Math Vocabulary\n"]
    for dcode, terms in domains.items():
        dname = DOMAIN_NAMES[dcode]
        lines.append(f"\n## {dname} ({grade}.{dcode})\n")
        for term, definition, example, misconception in terms:
            lines.append(f"### {term}\n")
            lines.append(f"**Definition:** {definition}\n")
            lines.append(f"**Example:** {example}\n")
            if misconception:
                lines.append(f"**Common misconception:** {misconception}\n")
    fname = f"grade-{grade}.md"
    with open(os.path.join(md_dir, fname), "w") as f:
        f.write("\n".join(lines))

print("Markdown files written to vocab_bank/")
