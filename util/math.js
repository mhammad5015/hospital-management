exports.generateMathOperation = () => {
    const operations = ["+", "-", "*"];
    const num1 = Math.floor(Math.random() * 10) + 1; // Random number between 1 and 100
    const num2 = Math.floor(Math.random() * 10) + 1; // Random number between 1 and 100
    const operator = operations[Math.floor(Math.random() * operations.length)];

    const operation = `${num1} ${operator} ${num2}`;
    return operation;
}

// Function to solve a math operation
exports.solveMathOperation = (operation) => {
    try {
        const result = eval(operation); // Evaluate the operation (e.g., "5 + 3")
        return result;
    } catch (error) {
        console.error("Error solving math operation:", error);
        return null;
    }
}
