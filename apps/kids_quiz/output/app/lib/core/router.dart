// [generated] generator=RouteGenerator template=route_go_router.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:go_router/go_router.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/presentation/screens/question_list_screen.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/presentation/screens/achievement_list_screen.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/presentation/screens/quiz_run_list_screen.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/presentation/screens/quiz_run_wizard_screen.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/presentation/screens/quiz_run_form_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/question',
  routes: [
      GoRoute(path: '/quiz-run/new', builder: (_, __) => const QuizRunFormScreen()),
      GoRoute(path: '/quiz-run/:id/edit', builder: (_, __) => const QuizRunFormScreen()),
      GoRoute(path: '/question', builder: (_, __) => const QuestionListScreen()),
      GoRoute(path: '/achievement', builder: (_, __) => const AchievementListScreen()),
      GoRoute(path: '/quiz-run', builder: (_, __) => const QuizRunListScreen()),
      GoRoute(path: '/quiz-run/wizard', builder: (_, __) => const QuizRunWizardScreen()),
  ],
);
