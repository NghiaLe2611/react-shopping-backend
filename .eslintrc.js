module.exports = {
    "env": {
        // "browser": false,
        "node": true,
        "commonjs": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "rules": {
        "no-unused-vars": [
            "warn"
        ],
        "no-mixed-spaces-and-tabs": "off",
        "no-extra-semi": "off",
        "no-useless-escape": ["warn"]
    }
}
