#include <iostream>
#include <vector>
#include <unordered_map>
#include <string>
#include <sstream>
#include <algorithm>

using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};

void run_test(string input_str) {
    stringstream test_ss(input_str);
    string line;
    getline(test_ss, line);
    stringstream ss_nums(line);
    vector<int> nums;
    int num;
    while (ss_nums >> num) nums.push_back(num);
    getline(test_ss, line);
    long long target = stoll(line);
    
    Solution sol;
    vector<int> result = sol.twoSum(nums, (int)target);
    sort(result.begin(), result.end());
    if (result.size() >= 2) cout << result[0] << " " << result[1];
    else cout << "EMPTY";
    cout << endl;
}

int main() {
    cout << "Test 1 (visible 0): "; run_test("2 7 11 15\n9");
    cout << "Test 2 (visible 1): "; run_test("3 2 4\n6");
    cout << "Test 3 (visible 2): "; run_test("3 3\n6");
    cout << "Test 4 (hidden 0): "; run_test("1 5 3 7\n8");
    cout << "Test 5 (hidden 1): "; run_test("-1 -2 -3 -4 -5\n-8");
    cout << "Test 6 (hidden 2): "; run_test("0 4 3 0\n0");
    cout << "Test 7 (hidden 3): "; run_test("500000000 800000000 900000000\n1700000000");
    cout << "Test 8 (hidden 4): "; run_test("5 5\n10");
    cout << "Test 9 (hidden 5): "; run_test("1 2 3 4 5 6 7 8 9 10\n19");
    cout << "Test 10 (hidden 6): "; run_test("10 20 30 40 50\n90");
    return 0;
}
