'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/common/Button';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/libs/axios';

interface Question {
  id: number;
  content: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
}

interface SelectedQuestion {
  questionId: number;
  selectedAnswer: number;
}

export default function GameMakeQuiz() {
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<
    SelectedQuestion[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const router = useRouter();

  // 랜덤 문제 10개 가져오기
  useEffect(() => {
    const fetchRandomQuestions = async () => {
      try {
        const response = await axiosInstance.get(
          '/api/quizzes/question-random'
        );
        setAvailableQuestions(response.data);
      } catch (error) {
        console.error('문제 가져오기 실패:', error);
        alert('문제를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    fetchRandomQuestions();
  }, []);

  // 문제 선택/해제
  const toggleQuestion = (questionId: number) => {
    setSelectedQuestions((prev) => {
      const isSelected = prev.some((q) => q.questionId === questionId);
      if (isSelected) {
        return prev.filter((q) => q.questionId !== questionId);
      } else {
        return [...prev, { questionId, selectedAnswer: 1 }];
      }
    });
  };

  // 정답 변경
  const updateAnswer = (questionId: number, selectedAnswer: number) => {
    setSelectedQuestions((prev) =>
      prev.map((q) =>
        q.questionId === questionId ? { ...q, selectedAnswer } : q
      )
    );
  };

  // 퀴즈 저장
  const saveQuiz = async () => {
    if (selectedQuestions.length === 0) {
      alert('최소 1개 이상의 문제를 선택해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      await axiosInstance.post('/api/quizzes/create', {
        questions: selectedQuestions,
      });

      alert('퀴즈가 성공적으로 저장되었습니다!');
      router.push('/front/game/guess-me/make-quiz/complete');
    } catch (error) {
      console.error('퀴즈 저장 실패:', error);
      alert('퀴즈 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingQuestions) {
    return (
      <div className="my-home-page py-4 px-4 pt-28 pb-28 mx-auto rounded-lg bg-gray-100 overflow-y-auto">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">⏳</div>
          <p className="text-gray-600">문제를 가져오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-home-page py-4 px-4 pt-10 pb-20 mx-auto rounded-lg bg-gray-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          {/* 뒤로가기 버튼과 타이틀 */}
          <div className="relative mb-6 min-h-[40px] flex items-center justify-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 absolute left-0 top-1/2 -translate-y-1/2"
              aria-label="뒤로가기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-800 text-center w-full">
              나를 맞춰봐 문제 만들기
            </h1>
          </div>
          <p className="text-gray-600">
            아래 문제들 중에서 선택하고 정답을 설정해주세요!
          </p>
        </div>

        {/* 선택된 문제 수 표시 */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-blue-800 font-medium">
            선택된 문제: {selectedQuestions.length}개
          </p>
        </div>

        {/* 문제 목록 */}
        <div className="space-y-4 mb-6">
          {availableQuestions.map((question) => {
            const isSelected = selectedQuestions.some(
              (q) => q.questionId === question.id
            );
            const selectedAnswer =
              selectedQuestions.find((q) => q.questionId === question.id)
                ?.selectedAnswer || 1;

            return (
              <div
                key={question.id}
                className={`p-6 rounded-lg shadow-md border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleQuestion(question.id)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      {question.content}
                    </h3>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[1, 2, 3, 4].map((optionNum) => (
                        <button
                          key={optionNum}
                          onClick={() =>
                            isSelected && updateAnswer(question.id, optionNum)
                          }
                          disabled={!isSelected}
                          className={`p-2 rounded border transition-all text-sm ${
                            isSelected && selectedAnswer === optionNum
                              ? 'bg-green-500 border-green-600 text-white font-medium'
                              : isSelected
                                ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {
                            question[
                              `option${optionNum}` as keyof Question
                            ] as string
                          }
                        </button>
                      ))}
                    </div>

                    {isSelected && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2 text-gray-700">
                          정답을 선택하세요:{' '}
                          <span className="text-green-600 font-semibold">
                            보기 {selectedAnswer}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 저장 버튼 */}
        {selectedQuestions.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="space-y-3">
              <Button
                onClick={saveQuiz}
                className="w-full bg-green-600 text-white py-3"
                disabled={isLoading}
              >
                {isLoading
                  ? '저장 중...'
                  : `선택한 ${selectedQuestions.length}개 문제로 퀴즈 만들기`}
              </Button>

              <Button
                onClick={() => router.push('/front/my-home')}
                className="w-full bg-gray-500 text-white py-3"
              >
                마이홈으로 돌아가기
              </Button>
            </div>
          </div>
        )}

        {/* 문제가 선택되지 않았을 때 안내 */}
        {selectedQuestions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <p className="text-gray-600 mb-2">
              아직 문제를 선택하지 않았습니다
            </p>
            <p className="text-gray-500 text-sm">
              위의 문제들 중에서 선택하고 정답을 설정해주세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
