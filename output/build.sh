# 팀 레포에서 개인 레포로 코드 복사

#!/bin/sh

mkdir -p output
cp -R ./* ./output

# .git, .github 등 불필요한 항목 제외 (선택)
rm -rf ./output/.git
rm -rf ./output/.github

# Git 추적용 더미 파일 추가
echo "배포용 더미 파일입니다." > ./output/.keep

# 디버깅용 출력
echo "📦 output 폴더 내용:"
ls -al output