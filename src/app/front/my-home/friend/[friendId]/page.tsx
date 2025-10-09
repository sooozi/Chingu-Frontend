'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Button from '@/components/common/Button';
import MessageModal from '@/components/common/MessageModal';
import { useRouter, useParams } from 'next/navigation';
import axios, { isAxiosError } from 'axios';
import axiosInstance from '@/libs/axios';

interface User {
  id: number;
  userId: string;
  name: string;
  nickname: string;
  email: string;
  profilePictureUrl: string;
  bio: string;
  joinDate: string;
  lastLoginDate: string;
  socialType: string;
  friendSince?: string;
}

interface Friend {
  friendUserId: number;
  nickname: string;
  name: string;
  score: number;
  friendSince: string;
}

// 퀴즈 관련 타입 추가
interface Quiz {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  isSolved: boolean;
  myScore?: number;
  totalQuestions: number;
}

interface QuizStats {
  totalQuizzes: number;
  solvedQuizzes: number;
  averageScore: number;
  friendshipScore: number;
}

// API 응답 타입 정의
interface FriendQuizInfo {
  userId: number;
  nickname: string;
  quizSetId: number | null;
}

interface QuizDetailResponse {
  quizSetId: number;
  title?: string;
  description?: string;
  createdAt?: string;
  created_at?: string;
  questions: Array<{
    questionId: number;
    content: string;
    option1: string;
    option2: string;
    option3: string;
    option4: string;
  }>;
}

export default function FriendDetailPage() {
  const router = useRouter();
  const params = useParams();
  const friendId = params.friendId as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  const [friendSince, setFriendSince] = useState<string>('');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  // 퀴즈 관련 상태 추가
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizStats, setQuizStats] = useState<QuizStats>({
    totalQuizzes: 0,
    solvedQuizzes: 0,
    averageScore: 0,
    friendshipScore: 0,
  });
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  const fetchUserInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/users/${friendId}`);

      if (response.status === 404) {
        setError('해당 사용자를 찾을 수 없습니다.');
        return;
      }

      const userData: User = response.data;
      setUser(userData);
      setFriendSince(userData.friendSince ?? '');

      // 친구 관계 확인
      await checkFriendStatus(userData.id);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setError('해당 사용자를 찾을 수 없습니다.');
        } else {
          setError('사용자 정보를 불러오는데 실패했습니다.');
        }
      } else {
        setError('오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [friendId]);

  useEffect(() => {
    if (friendId) {
      fetchUserInfo();
    }
  }, [friendId, fetchUserInfo]);

  // 친구 관계가 변경될 때마다 퀴즈 데이터 새로고침 (함수 정의 이후로 이동)

  // 친구 관계 확인 함수
  const checkFriendStatus = async (targetUserId: number) => {
    try {
      console.log('[친구 관계 확인] targetUserId:', targetUserId);

      // 친구 목록을 조회하여 이미 친구인지 확인
      const response = await axiosInstance.get('/api/friends');
      const friendsList = response.data;

      console.log('[친구 관계 확인] 친구 목록:', friendsList);

      // 친구 목록에서 해당 사용자가 있는지 확인
      const isFriend = friendsList.some(
        (friend: Friend) => friend.friendUserId === targetUserId
      );

      if (isFriend) {
        console.log('[친구 관계 확인] 이미 친구 관계임');
        setFriendSince(
          friendsList.find((f: Friend) => f.friendUserId === targetUserId)
            ?.friendSince || ''
        );
      } else {
        // 친구가 아니라면 친구 신청 API를 호출하여 이미 요청을 보냈는지 확인
        try {
          await axiosInstance.post('/api/friends/request', {
            friendId: targetUserId,
          });

          // 성공적으로 친구 신청이 되었다면 아직 요청을 보내지 않음
          console.log('[친구 관계 확인] 아직 친구 요청을 보내지 않음');
        } catch (requestErr) {
          if (isAxiosError(requestErr)) {
            if (requestErr.response?.status === 400) {
              if (
                requestErr.response.data?.message ===
                '이미 친구 요청을 보냈습니다.'
              ) {
                console.log('[친구 관계 확인] 이미 친구 요청을 보냄');
              } else if (
                requestErr.response.data?.message === '이미 친구입니다.'
              ) {
                console.log('[친구 관계 확인] 이미 친구 관계임');
              }
            }
          }

          // 기타 에러는 none으로 처리
          console.log('[친구 관계 확인] 기타 에러:', requestErr);
        }
      }
    } catch (err) {
      console.error('[친구 관계 확인 에러]', err);
      if (isAxiosError(err)) {
        console.log('[친구 관계 확인] API 에러:', err.response?.data);
      }
      // 에러 발생 시 기본값으로 설정
      setFriendSince('');
    }
  };

  // 친구가 만든 퀴즈 목록 조회
  const fetchFriendQuizzes = useCallback(async () => {
    if (!user) return;

    try {
      setIsQuizLoading(true);

      // friends-available API로 친구가 만든 퀴즈 확인
      const response = await axiosInstance.get(
        '/api/quizzes/friends-available'
      );

      // 현재 친구가 만든 퀴즈 찾기
      const friendQuiz = response.data.find(
        (friend: FriendQuizInfo) =>
          friend.userId === user.id && friend.quizSetId !== null
      );

      if (friendQuiz && friendQuiz.quizSetId) {
        // 퀴즈 세트 상세 정보 조회
        const quizDetailResponse = await axiosInstance.get<QuizDetailResponse>(
          `/api/quizzes/${friendQuiz.quizSetId}`
        );

        const quizData: QuizDetailResponse = quizDetailResponse.data;
        const questionsCount = quizData.questions?.length || 0;

        setQuizzes([
          {
            id: quizData.quizSetId,
            title: quizData.title || `${friendQuiz.nickname}님의 퀴즈`,
            description:
              quizData.description ||
              `${questionsCount}개의 문제로 구성된 퀴즈입니다`,
            totalQuestions: questionsCount,
            createdAt:
              quizData.createdAt ||
              quizData.created_at ||
              new Date().toISOString(),
            isSolved: false, // 아직 풀지 않음
            myScore: undefined,
          },
        ]);

        setQuizStats((prev) => ({
          ...prev,
          totalQuizzes: 1,
        }));
      } else {
        setQuizzes([]);
        setQuizStats((prev) => ({
          ...prev,
          totalQuizzes: 0,
        }));
      }
    } catch (err) {
      console.error('친구 퀴즈 조회 실패:', err);
      setQuizzes([]);
      setQuizStats((prev) => ({
        ...prev,
        totalQuizzes: 0,
      }));
    } finally {
      setIsQuizLoading(false);
    }
  }, [user]);

  // 퀴즈 풀기
  const handleSolveQuiz = (quizId: number) => {
    router.push(`/front/game/guess-me/solve-quiz?quizId=${quizId}`);
  };

  // 친구 정보가 로드되면 퀴즈 데이터도 가져오기
  useEffect(() => {
    if (user) {
      fetchFriendQuizzes();
    }
  }, [user, fetchFriendQuizzes]);

  // 우정 점수 조회
  const fetchFriendshipScore = useCallback(async () => {
    if (!user || !friendSince) return;

    try {
      const response = await axiosInstance.get(
        `/api/quizzes/scores?friendId=${user.id}`
      );
      if (response.data.score !== undefined) {
        setQuizStats((prev) => ({
          ...prev,
          friendshipScore: response.data.score,
        }));
      }
    } catch (err) {
      console.error('우정 점수 조회 실패:', err);
    }
  }, [user, friendSince]);

  // 친구 관계가 변경될 때마다 퀴즈 데이터 새로고침
  useEffect(() => {
    if (friendSince && user) {
      fetchFriendQuizzes();
      fetchFriendshipScore();
    }
  }, [friendSince, user, fetchFriendQuizzes, fetchFriendshipScore]);

  const handleSendMessage = () => {
    setIsMessageModalOpen(true);
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleFriendRequest = async () => {
    if (!user) return;

    console.log('[친구 신청] 사용자 정보:', user);
    console.log('[친구 신청] friendId:', user.id, '타입:', typeof user.id);

    // 이미 친구인 경우 친구 끊기 처리
    if (friendSince) {
      const confirmUnfriend = confirm('정말로 이 친구와 끊으시겠습니까?');
      if (!confirmUnfriend) return;

      try {
        setFriendRequestLoading(true);

        const response = await axiosInstance.delete(`/api/friends/${user.id}`);
        console.log('[친구 끊기 성공]', response.data);

        setFriendSince('');
        alert('친구 관계가 해제되었습니다.');
      } catch (err) {
        console.error('[친구 끊기 에러]', err);
        if (isAxiosError(err)) {
          alert(err.response?.data?.error || '친구 끊기에 실패했습니다.');
        } else {
          alert('친구 끊기에 실패했습니다.');
        }
      } finally {
        setFriendRequestLoading(false);
      }
      return;
    }

    // 친구 신청 처리
    try {
      setFriendRequestLoading(true);

      const response = await axiosInstance.post('/api/friends/request', {
        friendId: user.id,
      });

      console.log('[친구 신청 성공]', response.data);
      setFriendSince(response.data.friendSince);
      alert('친구 신청이 전송되었습니다!');
    } catch (err) {
      console.error('[친구 신청 에러 전체]', err);

      if (isAxiosError(err)) {
        console.error('[친구 신청 Axios 에러]', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          headers: err.response?.headers,
        });

        // 이미 친구인 경우는 성공으로 처리
        if (
          err.response?.status === 400 &&
          err.response.data?.message === '이미 친구입니다.'
        ) {
          console.log('[친구 신청] 이미 친구 관계임');
          setFriendSince(''); // response 없음
          return;
        }

        // 이미 친구 요청을 보낸 경우는 requested 상태로 처리
        if (
          err.response?.status === 400 &&
          err.response.data?.message === '이미 친구 요청을 보냈습니다.'
        ) {
          console.log('[친구 신청] 이미 친구 요청을 보냄');
          setFriendSince(''); // response 없음
          return;
        }

        const errorMessage =
          err.response?.data?.error ||
          err.response?.data?.details ||
          '친구 신청에 실패했습니다.';
        console.error('[친구 신청] 에러 메시지:', errorMessage);
        alert(errorMessage);
      } else {
        console.error('[친구 신청] 알 수 없는 에러:', err);
        alert('친구 신청에 실패했습니다.');
      }
    } finally {
      setFriendRequestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="my-home-page py-4 px-4 pt-10 mx-auto rounded-lg bg-gray-100">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-home-page py-4 px-4 pt-10 mx-auto rounded-lg bg-gray-100">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            type="button"
            onClick={handleGoBack}
            className="bg-blue-600 text-white"
          >
            뒤로 가기
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="my-home-page py-4 px-4 pt-10 mx-auto rounded-lg bg-gray-100">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">사용자 정보를 찾을 수 없습니다.</p>
          <Button
            type="button"
            onClick={handleGoBack}
            className="bg-blue-600 text-white"
          >
            뒤로 가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-home-page py-4 px-4 pt-10 pb-10 mx-auto rounded-lg bg-gray-100 overflow-y-auto">
      <div className="relative mb-6 min-h-[40px] flex items-center justify-center">
        <Button
          type="button"
          onClick={handleGoBack}
          variant="secondary"
          className="absolute left-0 top-1/2 -translate-y-1/2 px-3 py-1 text-sm"
        >
          ← 뒤로
        </Button>
        <h2 className="text-2xl font-semibold text-center w-full">
          친구 마이 홈
        </h2>
      </div>

      <div className="profile-card flex items-center justify-between mb-4 p-4 bg-white rounded-lg shadow-sm gap-2">
        <div className="flex items-center gap-2">
          <Image
            src={user.profilePictureUrl || '/images/default-profile.jpg'}
            alt="프로필 사진"
            width={64}
            height={64}
            className="object-cover rounded-full border border-gray-300"
          />
          <div className="profile-info">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{user.nickname}</h3>
              {friendSince && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  친구
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">이름: {user.name}</p>
            <p className="text-sm text-gray-500">ID: {user.userId}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">
            가입일: {new Date(user.joinDate).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500">
            마지막 로그인: {new Date(user.lastLoginDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="profile-intro p-4 bg-white rounded-lg shadow-sm mb-4">
        <h4 className="font-semibold mb-2">자기소개</h4>
        <p className="text-gray-700">{user.bio || '자기소개가 없습니다.'}</p>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Button
            type="button"
            className={`w-full text-white ${
              friendSince ? 'bg-red-600' : 'bg-blue-600'
            }`}
            onClick={handleFriendRequest}
            disabled={friendRequestLoading || !!friendSince}
          >
            {friendRequestLoading
              ? '신청 중...'
              : friendSince
                ? '친구 끊기'
                : '친구 맺기'}
          </Button>
        </div>
        <Button
          type="button"
          className={`flex-1 text-white ${
            friendSince ? 'bg-blue-600' : 'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={handleSendMessage}
          disabled={!friendSince}
        >
          쪽지 보내기
        </Button>
      </div>

      <div className="schedule-calendar bg-white p-6 rounded-lg shadow-sm mb-4 text-center text-gray-500">
        일정 캘린더가 들어갈 부분
      </div>

      {/* 퀴즈 섹션 - 친구인 경우에만 표시 */}
      {friendSince && (
        <>
          {/* 우정 점수 현황 */}
          <div className="quiz-stats bg-white p-4 rounded-lg shadow-sm mb-4">
            <h3 className="text-lg font-semibold mb-3">🏆 우정 점수 현황</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {quizStats.friendshipScore}
                </div>
                <div className="text-sm text-gray-600">우정 점수</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {quizStats.solvedQuizzes}/{quizStats.totalQuizzes}
                </div>
                <div className="text-sm text-gray-600">퀴즈 완료</div>
              </div>
            </div>
            {quizStats.averageScore > 0 && (
              <div className="text-center mt-3 p-2 bg-yellow-50 rounded">
                <span className="text-sm text-gray-600">평균 점수: </span>
                <span className="font-semibold text-yellow-600">
                  {quizStats.averageScore}점
                </span>
              </div>
            )}
          </div>

          {/* 친구가 만든 퀴즈 목록 */}
          <div className="friend-quizzes bg-white p-4 rounded-lg shadow-sm mb-4">
            <h3 className="text-lg font-semibold mb-3">
              🧩 {user.nickname}님이 만든 퀴즈
            </h3>
            {isQuizLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500 text-sm">
                  퀴즈를 불러오는 중...
                </p>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>아직 만든 퀴즈가 없어요 😢</p>
                <p className="text-sm mt-1">
                  퀴즈를 만들어달라고 요청해보세요!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className={`p-3 rounded-lg border ${
                      quiz.isSolved
                        ? 'bg-green-50 border-green-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">
                          {quiz.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {quiz.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>문제 수: {quiz.totalQuestions}개</span>
                          <span>
                            생성일:{' '}
                            {new Date(quiz.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {quiz.isSolved && quiz.myScore !== undefined && (
                          <div className="mt-2">
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              완료! 점수: {quiz.myScore}점
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        {quiz.isSolved ? (
                          <span className="inline-block bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                            완료
                          </span>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => handleSolveQuiz(quiz.id)}
                            className="bg-blue-600 text-white text-sm px-4 py-2"
                          >
                            퀴즈 풀기
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="my-groups bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-2">내 그룹 목록</h3>
        <div className="group-item bg-gray-200 p-3 rounded mb-2">그룹1</div>
        <div className="group-item bg-gray-200 p-3 rounded mb-2">그룹2</div>
        <div className="group-item bg-gray-200 p-3 rounded">그룹3</div>

        <Button
          type="button"
          className="flex-1 w-full bg-blue-600 text-white mt-4"
        >
          더보기
        </Button>
      </div>

      {/* 쪽지 보내기 모달 */}
      {user && (
        <MessageModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          receiver={user.userId}
          receiverName={user.nickname}
          isFriend={!!friendSince}
        />
      )}
    </div>
  );
}
